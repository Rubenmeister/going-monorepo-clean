import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';

/**
 * VoiceCommandController — endpoint /voice/command para que el orchestrator
 * (Wayra) pueda mandar comandos al voice-call-service via agent-bridge (Chaski).
 *
 * Patrón uniforme con customer-support-service (/support/command). El
 * agent-bridge ya está pensado para esto (ver agent-registry.ts donde
 * customer-support está registrado con commandPath: '/support/command').
 *
 * Acciones esperadas (se irán implementando en próximas iteraciones):
 *
 *  - block_caller_temporarily { from, durationMinutes }
 *      → agregar `from` a una blocklist en memoria (TTL = duration). Las
 *        próximas llamadas del número reciben TwiML <Hangup/> con mensaje
 *        "número bloqueado temporalmente". STUB hoy.
 *
 *  - update_voice_agent_prompt { agentVersion, promptDelta }
 *      → ops puede ajustar el system prompt del AI sin redeploy. Útil para
 *        respuestas a campañas o información temporal. STUB hoy.
 *
 *  - force_handoff_current_call { callId, reason }
 *      → si una call está dando vueltas y necesita humano, ops puede forzar
 *        el handoff inmediato. STUB hoy.
 */
@Controller('voice')
export class VoiceCommandController {
  private readonly logger = new Logger(VoiceCommandController.name);

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

    // STUB: switch sobre las acciones soportadas. Por ahora todas devuelven
    // 'not_implemented' — esto es scaffold. Cuando se implemente, cada caso
    // delega al service correspondiente y devuelve outcome real.
    switch (action) {
      case 'block_caller_temporarily':
      case 'update_voice_agent_prompt':
      case 'force_handoff_current_call':
        this.logger.warn(`[command] ${action} — STUB, no implementado todavía`);
        return {
          ok: false,
          status: 'not_implemented',
          message: `Action '${action}' está en scaffold — implementar en próxima fase`,
        };

      default:
        return {
          ok: false,
          status: 'unknown_action',
          message: `Action '${action}' no reconocida. Soportadas: block_caller_temporarily, update_voice_agent_prompt, force_handoff_current_call`,
        };
    }
  }
}
