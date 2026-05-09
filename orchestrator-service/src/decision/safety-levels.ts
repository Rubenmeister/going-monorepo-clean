/**
 * Safety levels para acciones que el Orchestrator ejecuta sobre los agentes.
 *
 * Los niveles vienen del doc de arquitectura `cerebro-mycortex.md`:
 *
 *  Cat 1 — informativas (alertas, logs, reportes). Ejecuta directo sin ack.
 *  Cat 2 — operacionales reversibles (ajustar threshold, abrir ticket,
 *          enviar mensaje a driver). Ejecuta + notifica ops para review.
 *  Cat 3 — irreversibles / alto costo (gasto marketing, cambio pricing,
 *          bloqueo de usuarios). Requiere ack en Telegram con timeout
 *          15 min antes de ejecutar.
 */

export type SafetyLevel = 1 | 2 | 3;

export interface SafetyLevelMeta {
  label:        string;
  description:  string;
  requiresAck:  boolean;
  ackTimeoutMs: number; // 0 si no aplica
  postNotify:   boolean; // notifica a ops DESPUÉS de ejecutar
}

export const SAFETY_LEVELS: Record<SafetyLevel, SafetyLevelMeta> = {
  1: {
    label:        'informativa',
    description:  'Alerta, log o reporte. Ejecuta directo.',
    requiresAck:  false,
    ackTimeoutMs: 0,
    postNotify:   false,
  },
  2: {
    label:        'reversible',
    description:  'Acción operacional reversible. Ejecuta + post-notify.',
    requiresAck:  false,
    ackTimeoutMs: 0,
    postNotify:   true,
  },
  3: {
    label:        'irreversible',
    description:  'Alto costo o irreversible. Requiere ack humano.',
    requiresAck:  true,
    ackTimeoutMs: 15 * 60 * 1000, // 15 min
    postNotify:   true,
  },
};

export function safetyMeta(level: SafetyLevel): SafetyLevelMeta {
  return SAFETY_LEVELS[level];
}
