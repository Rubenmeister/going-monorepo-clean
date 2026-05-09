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

  // ── human_only — Orchestrator NO ejecuta, solo reporta ────
  'replicate_viral_format':         'human_only', // requiere creatividad
  'add_more_operators':             'human_only', // contratación, no auto
  'configure_operators':            'human_only', // requiere setup manual
  'schedule_content_review_session':'human_only', // requiere coordinación
  'review_platform_content':        'human_only', // estrategia
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
