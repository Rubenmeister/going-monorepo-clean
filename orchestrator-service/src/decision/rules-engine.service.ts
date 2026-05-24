import { Injectable, Logger } from '@nestjs/common';
import { SafetyLevel } from './safety-levels';

/**
 * Mapea cada `intention.type` (output de MyCortex) a una acción concreta
 * que un agente puede ejecutar. Sin entry → la intención queda como
 * "human_only" y se reporta a Telegram para que un humano decida.
 *
 * Las reglas son configuración pura, no lógica. Se enriquecen tras la
 * semana de observación: anotamos los types reales que MyCortex propone
 * y agregamos sus mappings acá.
 *
 * Convención: `target` puede ser dinámico (string template con
 * {{intention.target}}) o se deriva del `args` builder.
 */

export interface ActionRule {
  agent:       string;       // ej. 'marketing-agent', 'customer-support-service'
  action:      string;       // ej. 'driver_bonus_zone'
  safetyLevel: SafetyLevel;
  /** Builder de args desde la intención. Default: pasa intention.target + intention.data. */
  buildArgs?: (intent: { target?: string; data?: Record<string, unknown> }) => Record<string, unknown>;
}

/**
 * REGLAS INICIALES.
 *
 * Conservador: solo agregamos las que ya tenemos certeza de qué agent
 * ejecuta y qué safety level corresponde. El resto cae a 'human_only'.
 *
 * Después de 1 semana de observación, ampliar con los types reales que
 * MyCortex haya propuesto.
 */
export const RULES: Record<string, ActionRule | 'human_only'> = {
  // ── Cat 1 — informativas (ejecuta directo) ────────────────
  'log_anomaly': {
    agent: 'cerebro-service',
    action: 'log_anomaly',
    safetyLevel: 1,
  },
  // Force re-check de los agents read-only — Cat 1 porque solo re-lee
  // datos externos (Sentry / Vercel) y publica al cerebro. Útil cuando
  // MyCortex sospecha algo y quiere data fresca sin esperar 6h.
  'force_mobile_check': {
    agent: 'mobile-agent',
    action: 'force_check',
    safetyLevel: 1,
  },
  'force_frontend_check': {
    agent: 'frontend-agent',
    action: 'force_check',
    safetyLevel: 1,
  },

  // ── Cat 2 — operacionales reversibles ─────────────────────
  // Customer-support: abrir ticket es reversible (se puede cerrar).
  'open_ticket': {
    agent: 'customer-support-service',
    action: 'open_ticket',
    safetyLevel: 2,
  },
  'investigate_driver': {
    agent: 'customer-support-service',
    action: 'open_ticket',
    safetyLevel: 2,
    buildArgs: (intent) => ({
      reason: 'investigation',
      driverId: intent.target,
      data: intent.data,
    }),
  },
  // Page operator vía Telegram — reversible (es solo una alerta).
  'page_oncall_operator': {
    agent: 'customer-support-service',
    action: 'page_operator',
    safetyLevel: 2,
  },
  // Cleanup de handoffs estancados sin operatorId — reversible: el operador
  // puede reabrir cualquier conversación si se cerró por error.
  'cleanup_stale_customer_handoffs': {
    agent: 'customer-support-service',
    action: 'cleanup_handoffs',
    safetyLevel: 2,
    buildArgs: (intent) => ({
      olderThanDays: (intent.data?.olderThanDays as number) ?? 7,
    }),
  },

  // ── Cat 3 — irreversibles / alto costo (requieren ack) ────
  // Bonos a drivers gastan presupuesto de marketing.
  'boost_driver_supply': {
    agent: 'marketing-agent',
    action: 'driver_bonus_zone',
    safetyLevel: 3,
    buildArgs: (intent) => ({
      zone: intent.target,
      ...intent.data,
    }),
  },

  // ── Voice call (Uyari) — triggers de patrones telefónicos ────
  // Reactivo a eventos publicados por voice-call-service. STUB de mapeo
  // que ya queda en RULES para que cuando Uyari empiece a publicar
  // eventos reales, mycortex pueda emitir Intentions y Wayra las dispatchee.

  // Caller spam/fraud — Cat 2 reversible (bloqueo temporal con TTL).
  'block_voice_caller': {
    agent:       'voice-call-service',
    action:      'block_caller_temporarily',
    safetyLevel: 2,
    buildArgs: (intent) => ({
      from: intent.target,
      durationMinutes: (intent.data?.durationMinutes as number) ?? 60,
    }),
  },

  // Forzar handoff de una call en curso a humano. Cat 2 (reversible —
  // el operador puede devolver la call al AI si era falsa alarma).
  'force_handoff_voice_call': {
    agent:       'voice-call-service',
    action:      'force_handoff_current_call',
    safetyLevel: 2,
    buildArgs: (intent) => ({
      callId: intent.target,
      reason: (intent.data?.reason as string) ?? 'mycortex_requested',
    }),
  },

  // Revisar prompts del voice agent — human_only porque requiere creatividad
  // y entendimiento del negocio. Mycortex puede sugerirlo pero la edición
  // del prompt va por humano.
  'review_voice_agent_prompts': 'human_only',

  // ── human_only — Orchestrator NO ejecuta, solo reporta ────
  'replicate_viral_format':         'human_only', // requiere creatividad
  'add_more_operators':             'human_only', // contratación, no auto
  'configure_operators':            'human_only', // requiere setup manual
  'schedule_content_review_session':'human_only', // requiere coordinación
  'review_platform_content':        'human_only', // estrategia

  // Tipos meta que MyCortex emite cuando duda del estado del sistema.
  // Marcamos human_only EXPLÍCITO para sacarlos del bucket "unknown" —
  // así admin-dashboard distingue "no automatizable por diseño" vs
  // "type que MyCortex inventó y nadie ha decidido qué hacer".
  'request_human_decision_on_zero_state':  'human_only', // calibración del operador
  'confirm_system_operational_state':      'human_only', // operador responde A/B/C
  'establish_manual_monitoring_fallback':  'human_only', // operación manual
  'audit_snapshot_generation_logic':       'human_only', // requiere developer
  'request_going_agent_deep_dive':         'human_only', // going-agent corre cron propio
  'emergency_data_validation':             'human_only', // requiere developer
};

@Injectable()
export class RulesEngineService {
  private readonly logger = new Logger(RulesEngineService.name);

  /**
   * Resuelve una intención a una acción ejecutable. Devuelve null si:
   *  - El type no está en RULES y no hay default → 'unknown' (Telegram)
   *  - El type está marcado como 'human_only' → solo notifica
   */
  resolve(intent: {
    type:    string;
    target?: string;
    data?:   Record<string, unknown>;
  }): { action: ActionRule; args: Record<string, unknown> } | { humanOnly: true; reason: string } | null {
    const rule = RULES[intent.type];

    if (rule === undefined) {
      this.logger.warn(
        `Intention type "${intent.type}" no está en RULES — tratada como unknown (human-only por default)`,
      );
      return { humanOnly: true, reason: `unknown_type: ${intent.type}` };
    }

    if (rule === 'human_only') {
      return { humanOnly: true, reason: 'rule_configured_human_only' };
    }

    const args = rule.buildArgs
      ? rule.buildArgs(intent)
      : { target: intent.target, ...(intent.data || {}) };

    return { action: rule, args };
  }

  /** Listado de types soportados (para el endpoint /rules de auditoría). */
  listSupportedTypes(): { type: string; rule: ActionRule | 'human_only' }[] {
    return Object.entries(RULES).map(([type, rule]) => ({ type, rule }));
  }
}
