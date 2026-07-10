import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VoiceCommandService } from '../voice/voice-command.service';

/**
 * VoiceCommandController — endpoint /voice/command para que el orchestrator
 * (Wayra) pueda mandar comandos al voice-call-service via agent-bridge (Chaski).
 *
 * Patrón uniforme con customer-support-service (/support/command). El
 * agent-bridge ya está pensado para esto (ver agent-registry.ts donde
 * customer-support está registrado con commandPath: '/support/command').
 *
 * Acciones soportadas:
 *
 *  - block_caller_temporarily { from, durationMinutes }
 *      → agrega `from` a una blocklist en memoria (TTL = duration). Las
 *        próximas llamadas del número reciben TwiML <Hangup/> con mensaje
 *        "número bloqueado temporalmente".
 *
 *  - update_voice_agent_prompt { agentVersion, promptDelta }
 *      → ops puede ajustar el system prompt del AI sin redeploy. Útil para
 *        respuestas a campañas o información temporal. Aplica en la
 *        SIGUIENTE sesión creada (las activas siguen con su prompt).
 *
 *  - force_handoff_current_call { callId, reason }
 *      → si una call está dando vueltas y necesita humano, ops puede forzar
 *        el handoff inmediato a operador (PSTN redirect o notif Telegram).
 *
 * Endpoint adicional GET /voice/command/state para inspección de ops.
 */
@Controller('voice')
export class VoiceCommandController {
  private readonly logger = new Logger(VoiceCommandController.name);
  private readonly internalToken: string;

  constructor(
    private readonly commands: VoiceCommandService,
    private readonly config: ConfigService,
  ) {
    this.internalToken = this.config.get<string>('INTERNAL_SERVICE_TOKEN') ?? '';
  }

  /**
   * Auth S2S (auditoría Bloque 2 #13): estos comandos (bloquear llamadas,
   * override de prompt, force-handoff) los despacha SOLO el orchestrator vía
   * agent-bridge, que envía `X-Internal-Token: <INTERNAL_SERVICE_TOKEN>` (ver
   * http-service.client.ts). También aceptamos `Authorization: Bearer <token>`
   * por consistencia con /voice/metrics/*. Fail-closed: si hay token
   * configurado y ninguno coincide → 401. NUNCA público.
   */
  private assertInternalAuth(
    internalTokenHeader?: string,
    authHeader?: string,
    ctx = 'command',
  ): void {
    if (!this.internalToken) {
      this.logger.warn(`[${ctx}] INTERNAL_SERVICE_TOKEN no configurado — auth desactivada (solo dev)`);
      return;
    }
    const viaHeader = internalTokenHeader === this.internalToken;
    const viaBearer = authHeader === `Bearer ${this.internalToken}`;
    if (!viaHeader && !viaBearer) {
      this.logger.warn(`[${ctx}] auth S2S rechazada`);
      throw new UnauthorizedException('Token inválido o ausente');
    }
  }

  @Post('command')
  @HttpCode(HttpStatus.OK)
  async command(
    @Body() body: {
      decisionId?: string;     // id de la Decision del orchestrator que generó este command
      action:      string;     // ej. 'block_caller_temporarily'
      payload?:    Record<string, unknown>;
    },
    @Headers('x-internal-token') internalTokenHeader?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    this.assertInternalAuth(internalTokenHeader, authHeader, 'command');
    const { decisionId, action, payload } = body ?? {};
    if (!action) {
      return { ok: false, error: 'action requerida' };
    }

    this.logger.log(
      `[command] decisionId=${decisionId ?? 'none'} action=${action} payload=${JSON.stringify(payload ?? {}).slice(0, 200)}`,
    );

    switch (action) {
      case 'block_caller_temporarily': {
        const from = String((payload as any)?.from ?? '');
        const durationMinutes = Number((payload as any)?.durationMinutes ?? 0);
        const result = this.commands.blockCallerTemporarily({ from, durationMinutes });
        if (!result.ok) {
          return { ok: false, status: 'invalid_payload', error: result.error };
        }
        return { ok: true, action, decisionId, blockedUntil: result.blockedUntil };
      }

      case 'update_voice_agent_prompt': {
        const agentVersion = String((payload as any)?.agentVersion ?? '');
        const promptDelta  = String((payload as any)?.promptDelta  ?? '');
        const result = this.commands.updateVoiceAgentPrompt({ agentVersion, promptDelta });
        if (!result.ok) {
          return { ok: false, status: 'invalid_payload', error: result.error };
        }
        return { ok: true, action, decisionId, effectiveFrom: result.effectiveFrom };
      }

      case 'force_handoff_current_call': {
        const callId = String((payload as any)?.callId ?? '');
        const reason = String((payload as any)?.reason ?? 'forced_by_ops');
        const result = await this.commands.forceHandoffCurrentCall({ callId, reason });
        if (!result.ok) {
          return { ok: false, status: 'execution_failed', error: result.error };
        }
        return { ok: true, action, decisionId, mode: result.mode };
      }

      default:
        return {
          ok: false,
          status: 'unknown_action',
          message: `Action '${action}' no reconocida. Soportadas: block_caller_temporarily, update_voice_agent_prompt, force_handoff_current_call`,
        };
    }
  }

  /**
   * GET /voice/command/state — snapshot del estado de los comandos para
   * inspección por ops/dashboards. NO modifica nada.
   *
   * Útil para verificar:
   *  - quién está actualmente bloqueado y hasta cuándo
   *  - si hay un prompt override activo (qué versión, hace cuánto)
   *
   * No expone el callId activo del force_handoff porque ese estado vive
   * en RealtimeBridgeService.sessions y es ephemeral.
   */
  @Get('command/state')
  state(
    @Headers('x-internal-token') internalTokenHeader?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    this.assertInternalAuth(internalTokenHeader, authHeader, 'command/state');
    return {
      activeBlocks:           this.commands.listActiveBlocks(),
      lastPromptOverrideMeta: this.commands.getLastPromptOverrideMeta(),
    };
  }

  /**
   * GET /voice/metrics/active-blocks?from=+593...
   *
   * Endpoint para el ActionVerifier del orchestrator. Después de despachar
   * `block_caller_temporarily`, el verifier consulta acá para confirmar que
   * el bloqueo efectivamente quedó activo. Cierra el loop:
   *   anomaly → mycortex → orchestrator → /voice/command → /voice/metrics → verify
   *
   * Auth: requiere header `Authorization: Bearer <INTERNAL_SERVICE_TOKEN>`.
   * El token es compartido entre orchestrator y todos los agents que
   * exponen métricas de verificación (mismo patrón que customer-support).
   *
   * Response shape (estable, no romper sin coordinar con orchestrator):
   *   { from, count: 0|1, blockedUntil?, asOf }
   *
   * `count` siempre es 0 o 1 (un caller solo puede estar en blocklist
   * una vez — re-bloquear extiende el TTL al máximo, no duplica entrada).
   * El verifier mide `direction: 'increase', minDelta: 1` así que con 1
   * post-acción ya cuenta como convergido (pre-acción siempre es 0).
   *
   * NO devolver toda la lista por seguridad — solo el query target.
   */
  @Get('metrics/active-blocks')
  activeBlocksFor(
    @Query('from') from: string,
    @Headers('authorization') authHeader?: string,
  ) {
    // Auth check inline. Mismo patrón que customer-support pero sin guard
    // dedicado (voice-call-service no tiene auth modules todavía — esto
    // se factoriza si agregamos un segundo endpoint protegido).
    if (this.internalToken) {
      const expected = `Bearer ${this.internalToken}`;
      if (authHeader !== expected) {
        this.logger.warn(`[metrics/active-blocks] auth rechazado from=${from?.slice(0, 6)}...`);
        throw new UnauthorizedException('Token inválido o ausente');
      }
    } else {
      // En dev sin token configurado, permitimos pero warn — igual que
      // hacemos con TWILIO_AUTH_TOKEN. En prod siempre hay token seteado.
      this.logger.warn('[metrics/active-blocks] INTERNAL_SERVICE_TOKEN no configurado — auth desactivada');
    }

    if (!from || !from.startsWith('+')) {
      return { from: from ?? '', count: 0, asOf: new Date().toISOString(), error: 'from debe ser E.164' };
    }

    // listActiveBlocks() ya hace cleanup perezoso de los expirados,
    // así que el resultado es siempre el estado actual real.
    const all = this.commands.listActiveBlocks();
    const match = all.find((b) => b.from === from);

    return {
      from,
      count:        match ? 1 : 0,
      blockedUntil: match?.blockedUntil,
      asOf:         new Date().toISOString(),
    };
  }

  /**
   * GET /voice/metrics/handoff-pending?callId=CA...
   *
   * Endpoint para el ActionVerifier post-`force_handoff_voice_call`. Cierra
   * el loop voice-handoff-stuck end-to-end:
   *
   *   anomaly voice_handoff_stuck (voice-call publisher)
   *     → cerebro EventHandler
   *     → AnomalyRulesService rule → Intention force_handoff_voice_call
   *     → orchestrator dispatcher
   *     → POST /voice/command { action: force_handoff_current_call }
   *     → voice-call hace Twilio Calls.update
   *     → 15s después: ActionVerifier llama acá
   *     → cuenta vuelve a 0 → converged
   *     → OutcomeTracker registra success
   *
   * Response shape (estable, no romper sin coordinar con orchestrator):
   *   { callId, count: 0|1, asOf }
   *
   * `count` = 1 si la llamada con ese callId sigue pending handoff (handoff
   * requested pero no transferred); 0 si ya fue transferred o la sesión cerró.
   *
   * Auth: requiere `Authorization: Bearer <INTERNAL_SERVICE_TOKEN>` (mismo
   * patrón que metrics/active-blocks).
   */
  @Get('metrics/handoff-pending')
  handoffPendingFor(
    @Query('callId') callId: string,
    @Headers('authorization') authHeader?: string,
  ) {
    if (this.internalToken) {
      const expected = `Bearer ${this.internalToken}`;
      if (authHeader !== expected) {
        this.logger.warn(`[metrics/handoff-pending] auth rechazado callId=${callId?.slice(0, 12)}...`);
        throw new UnauthorizedException('Token inválido o ausente');
      }
    } else {
      this.logger.warn('[metrics/handoff-pending] INTERNAL_SERVICE_TOKEN no configurado — auth desactivada');
    }

    if (!callId) {
      return { callId: '', count: 0, asOf: new Date().toISOString(), error: 'callId requerido' };
    }

    const pending = this.commands.isCallPendingHandoff(callId);
    return {
      callId,
      count: pending ? 1 : 0,
      asOf:  new Date().toISOString(),
    };
  }
}
