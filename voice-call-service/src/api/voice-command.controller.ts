import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
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

  constructor(private readonly commands: VoiceCommandService) {}

  @Post('command')
  @HttpCode(HttpStatus.OK)
  async command(@Body() body: {
    decisionId?: string;     // id de la Decision del orchestrator que generó este command
    action:      string;     // ej. 'block_caller_temporarily'
    payload?:    Record<string, unknown>;
  }) {
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
  state() {
    return {
      activeBlocks:           this.commands.listActiveBlocks(),
      lastPromptOverrideMeta: this.commands.getLastPromptOverrideMeta(),
    };
  }
}
