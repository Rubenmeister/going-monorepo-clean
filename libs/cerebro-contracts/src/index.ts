// Single source of truth para el contrato Agente → Cerebro.
//
// Lo importan tanto los agentes (publishers) como el cerebro-service
// (subscriber + validador).

export {
  AGENT_IDS,
  AgentIdSchema,
  AnomalySchema,
  AnomalySeveritySchema,
  ActionTakenSchema,
  ActionProposedSchema,
  RunStatusSchema,
  AgentRunEventSchema,
  topicNameForAgent,
} from './event';

export type {
  AgentId,
  Anomaly,
  AnomalySeverity,
  ActionTaken,
  ActionProposed,
  RunStatus,
  AgentRunEvent,
} from './event';

export { publishAgentRunEvent } from './publisher';
export type { PublishOptions } from './publisher';
