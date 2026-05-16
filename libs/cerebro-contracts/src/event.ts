import { z } from 'zod';

// ─── Identidad de cada agente del ecosistema ──────────────────────────────
//
// El doc de arquitectura `docs/architecture/cerebro-mycortex.md` define 6+
// agentes. La unión incluye los que existen hoy en el monorepo y se irá
// extendiendo cuando aparezcan nuevos.

export const AGENT_IDS = [
  'ops-agent',
  'financial-agent',
  'content-agent',
  'marketing-agent',
  'going-agent',
  'customer-support-service',
  'mobile-agent',
  'frontend-agent',
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export const AgentIdSchema = z.enum(AGENT_IDS);

// ─── Anomalía detectada durante el run ────────────────────────────────────
//
// El agente NO toma acción correctiva por su cuenta — la reporta para que
// el Orchestrator (cuando exista) o un humano decida qué hacer.

export const AnomalySeveritySchema = z.enum(['info', 'warning', 'critical']);
export type AnomalySeverity = z.infer<typeof AnomalySeveritySchema>;

export const AnomalySchema = z.object({
  type:     z.string(),                          // ej. 'no_driver_assigned', 'driver_idle'
  severity: AnomalySeveritySchema,
  message:  z.string(),
  data:     z.record(z.unknown()).optional(),    // detalle libre por type
});
export type Anomaly = z.infer<typeof AnomalySchema>;

// ─── Acción ya ejecutada por el agente durante este run ───────────────────
//
// Cosas que el agente HIZO motu propio (alertar a Telegram, suprimir
// notificación, etc.). Sirve para auditoría — el Cerebro puede correlacionar
// "el agente alertó X pero el problema persistió Y".

export const ActionTakenSchema = z.object({
  type:   z.string(),                            // ej. 'sent_telegram_alert'
  target: z.string().optional(),                 // ej. driverId, rideId, chatId
  result: z.enum(['ok', 'failed', 'suppressed']),
  data:   z.record(z.unknown()).optional(),
});
export type ActionTaken = z.infer<typeof ActionTakenSchema>;

// ─── Acción propuesta para que otro agente / humano ejecute ──────────────
//
// El agente detecta algo pero NO tiene los permisos / scope para resolverlo.
// Lo eleva al Cerebro. Ejemplo: ops-agent ve baja oferta en una zona →
// propone `boost_driver_supply` con urgency 0.85 para que marketing-agent
// (vía Orchestrator) ofrezca un bono.

export const ActionProposedSchema = z.object({
  type:    z.string(),                           // ej. 'boost_driver_supply'
  target:  z.string().optional(),                // ej. zona, driverId
  reason:  z.string(),
  urgency: z.number().min(0).max(1).optional(),  // 0 (puede esperar) → 1 (urgente)
  data:    z.record(z.unknown()).optional(),
});
export type ActionProposed = z.infer<typeof ActionProposedSchema>;

// ─── Evento principal: snapshot del run del agente ───────────────────────
//
// Se publica al topic `agent.<agentId>.events` UNA VEZ al final del run del
// cron. Incluye lo que el agente vio, hizo y propone.

export const RunStatusSchema = z.enum(['success', 'partial_failure', 'failure']);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const AgentRunEventSchema = z.object({
  agentId:       AgentIdSchema,
  runId:         z.string().min(1),              // uuid v4 idealmente
  startedAt:     z.string().datetime(),          // ISO 8601 UTC
  finishedAt:    z.string().datetime(),
  durationMs:    z.number().int().nonnegative(),
  status:        RunStatusSchema,
  metrics:       z.record(z.union([z.number(), z.string()])).default({}),
  anomalies:     z.array(AnomalySchema).default([]),
  actionsTaken:  z.array(ActionTakenSchema).default([]),
  actionsProposed: z.array(ActionProposedSchema).default([]),
  meta: z.object({
    gitSha: z.string().optional(),
    runEnv: z.enum(['production', 'staging', 'development']).default('production'),
  }).default({ runEnv: 'production' }),
});

export type AgentRunEvent = z.infer<typeof AgentRunEventSchema>;

// ─── Helper para construir el shape del topic name desde un agentId ──────

export function topicNameForAgent(agentId: AgentId): string {
  // Convención: agent.<short-name>.events
  // Sacamos sufijos "-agent" / "-service" para que el topic quede limpio.
  const short = agentId.replace(/-agent$/, '').replace(/-service$/, '');
  return `agent.${short}.events`;
}
