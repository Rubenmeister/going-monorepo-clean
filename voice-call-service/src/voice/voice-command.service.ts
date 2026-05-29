import { Injectable, Logger } from '@nestjs/common';
import { RealtimeBridgeService } from './realtime-bridge.service';

/**
 * VoiceCommandService — Backing store + ejecutor de los comandos que el
 * orchestrator (Wayra) envía al voice-call-service vía `/voice/command`.
 *
 * Mantiene en memoria:
 *   1. **blocklist**: números temporalmente bloqueados (TTL configurable).
 *      Consultado por TwilioController.voiceWebhook ANTES de empezar la
 *      sesión de voz — si el caller está bloqueado, devuelve TwiML
 *      <Hangup/> con mensaje custom.
 *
 *   2. **promptOverride**: ajuste textual al system prompt del AI sin
 *      redeploy. Útil para campañas temporales (ej. "menciona la nueva ruta
 *      Quito-Riobamba a partir del 1 de julio") o respuestas a incidencias
 *      ("disculpe, hoy el servicio está reducido por feriado").
 *      Consumido por RealtimeBridgeService al construir el system prompt.
 *
 *   3. **forceHandoff**: gatillo manual de handoff sobre una llamada activa.
 *      El bridge mantiene `sessions` indexadas por streamSid; este service
 *      las localiza por callId y le pide al bridge que ejecute el handoff.
 *
 * **Por qué memoria y no DB?**
 *  - Los blocks son de corto plazo (minutos a 1h máx). Si el servicio
 *    reinicia (rolling deploy), perder el block es aceptable — el peor
 *    caso es que el caller spammer recupera la habilidad de llamar antes
 *    de tiempo, no rompemos nada.
 *  - El prompt override es operativo, también corto plazo. Si se quiere
 *    persistente se hace un redeploy con el cambio en el prompt base.
 *  - Una sola instancia de Cloud Run con `min-instances=1` mantiene el
 *    estado mientras corre. Si escalamos a múltiples instancias en el
 *    futuro, evaluamos mover a Redis (mismo patrón que driver compliance).
 */
@Injectable()
export class VoiceCommandService {
  private readonly logger = new Logger(VoiceCommandService.name);

  /** Map<E.164, expiresAt epoch ms>. Se limpia perezosamente en cada `isBlocked`. */
  private readonly blocklist = new Map<string, number>();

  /** Metadata del último override aplicado, para inspección. El delta real
   *  vive en el bridge (RealtimeBridgeService.promptOverride). */
  private lastPromptOverrideMeta: {
    agentVersion: string;
    setAt:        number;
  } | null = null;

  constructor(private readonly bridge: RealtimeBridgeService) {}

  // ──────────────────────────────────────────────────────────────────────
  //  Block a caller (acción: block_caller_temporarily)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Bloquea un número de teléfono por un período de tiempo dado. Si el
   * número ya estaba bloqueado, extiende el TTL al máximo entre el viejo
   * y el nuevo (defensa: ops podría ejecutar el comando dos veces).
   *
   * Validaciones:
   *  - `from` debe ser formato E.164 (`+...`). Si no, error.
   *  - `durationMinutes` rango [1, 1440] (1 día máx).
   */
  blockCallerTemporarily(input: {
    from:             string;
    durationMinutes:  number;
  }): { ok: boolean; blockedUntil?: string; error?: string } {
    if (!input.from || !input.from.startsWith('+')) {
      return { ok: false, error: 'from debe ser E.164 (ej. +593984037949)' };
    }
    const minutes = Math.floor(input.durationMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
      return { ok: false, error: 'durationMinutes debe estar entre 1 y 1440' };
    }
    const newExpiry = Date.now() + minutes * 60 * 1000;
    const prevExpiry = this.blocklist.get(input.from) ?? 0;
    const expiresAt = Math.max(prevExpiry, newExpiry);
    this.blocklist.set(input.from, expiresAt);
    this.logger.warn(
      `[block] ${input.from} bloqueado por ${minutes}min hasta ${new Date(expiresAt).toISOString()}`,
    );
    return { ok: true, blockedUntil: new Date(expiresAt).toISOString() };
  }

  /**
   * Lookup rápido: ¿este número está actualmente bloqueado?
   * Llamado en el flow de TwilioController.voiceWebhook ANTES de empezar
   * la sesión Realtime. Limpia entries expiradas perezosamente.
   */
  isBlocked(from: string): boolean {
    const expiry = this.blocklist.get(from);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.blocklist.delete(from);
      return false;
    }
    return true;
  }

  /** Útil para debug/admin/ops: snapshot de los bloqueos activos. */
  listActiveBlocks(): Array<{ from: string; blockedUntil: string }> {
    const now = Date.now();
    const active: Array<{ from: string; blockedUntil: string }> = [];
    for (const [from, expiry] of this.blocklist.entries()) {
      if (now > expiry) {
        this.blocklist.delete(from);
        continue;
      }
      active.push({ from, blockedUntil: new Date(expiry).toISOString() });
    }
    return active;
  }

  // ──────────────────────────────────────────────────────────────────────
  //  Prompt override (acción: update_voice_agent_prompt)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Pone un override sobre el system prompt del AI. Se concatena al prompt
   * base que arma RealtimeBridgeService.buildSystemPrompt en la SIGUIENTE
   * sesión creada (no afecta sesiones en curso — eso requeriría reiniciar
   * el contexto del agente, demasiado disruptivo).
   *
   * Validaciones:
   *  - `delta` no puede estar vacío. Para limpiar override, llamar
   *    clearPromptOverride() (que no se expone como acción remota: requiere
   *    redeploy o restart manual — defensa contra abuse).
   *  - `delta` se truncará a 2000 caracteres (prevenir prompt-stuffing).
   */
  updateVoiceAgentPrompt(input: {
    agentVersion: string;
    promptDelta:  string;
  }): { ok: boolean; effectiveFrom?: string; error?: string } {
    if (!input.agentVersion || !input.promptDelta) {
      return { ok: false, error: 'agentVersion y promptDelta requeridos' };
    }
    const delta = input.promptDelta.trim().slice(0, 2000);
    if (!delta) {
      return { ok: false, error: 'promptDelta vacío después de trim' };
    }
    this.bridge.setPromptOverride(delta);
    this.lastPromptOverrideMeta = {
      agentVersion: input.agentVersion,
      setAt:        Date.now(),
    };
    this.logger.warn(
      `[prompt-override] aplicado v=${input.agentVersion} delta="${delta.slice(0, 80)}..."`,
    );
    return {
      ok: true,
      effectiveFrom: 'next-session', // sesiones nuevas; las activas siguen con su prompt
    };
  }

  /** Inspección de metadata del último override. El delta lo expone el bridge. */
  getLastPromptOverrideMeta(): { agentVersion: string; setAt: number } | null {
    return this.lastPromptOverrideMeta;
  }

  /** Limpia el override. No expuesto como comando remoto (defensa). */
  clearPromptOverride(): void {
    this.bridge.setPromptOverride(null);
    this.lastPromptOverrideMeta = null;
    this.logger.log('[prompt-override] limpiado');
  }

  // ──────────────────────────────────────────────────────────────────────
  //  Force handoff (acción: force_handoff_current_call)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Fuerza el handoff de una llamada activa al operador humano. Útil cuando
   * ops detecta (por dashboard o llamada paralela) que el AI está en loop o
   * el caller necesita intervención inmediata.
   *
   * Flujo:
   *  1. Localizar la sesión activa por callId (el bridge la tiene indexada
   *     por streamSid, pero cada sesión sabe su callId)
   *  2. Invocar bridge.forceHandoffByCallId(callId, reason) que:
   *     - Marca handoffRequested=true en la BridgeContext
   *     - Si HANDOFF_OPERATOR_PHONE está set, hace Twilio Calls.update
   *       redirigiendo al TwiML /twilio/handoff-twiml/:callId
   *     - Si no, dispara notificación a Telegram (operador devuelve la
   *       llamada manualmente)
   *
   * Si no hay sesión activa con ese callId (llamada ya terminó, callId
   * incorrecto, etc.), retorna `not_found`.
   */
  async forceHandoffCurrentCall(input: {
    callId: string;
    reason: string;
  }): Promise<{ ok: boolean; mode?: 'pstn_redirect' | 'callback_notified'; error?: string }> {
    if (!input.callId) return { ok: false, error: 'callId requerido' };
    const reason = (input.reason ?? '').trim().slice(0, 500) || 'forced_by_ops';

    try {
      const result = await this.bridge.forceHandoffByCallId(input.callId, reason);
      if (!result) {
        return { ok: false, error: `Llamada ${input.callId.slice(0, 12)}... no encontrada o ya cerrada` };
      }
      this.logger.warn(
        `[force-handoff] callId=${input.callId.slice(0, 12)} mode=${result.mode} reason="${reason.slice(0, 60)}"`,
      );
      return { ok: true, mode: result.mode };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`[force-handoff] error callId=${input.callId.slice(0, 12)}: ${msg}`);
      return { ok: false, error: `Handoff falló: ${msg}` };
    }
  }
}
