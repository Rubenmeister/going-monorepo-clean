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

export { parseCommandFromEnv, runCommandMode } from './command';
export type { AgentCommand, CommandHandler } from './command';

// Identidad cultural: nombres Quichua de los servicios para humanos.
export {
  BRAIN_LAYERS,
  AGENTS,
  SERVICE_IDENTITY,
  whoami,
  formatIdentity,
} from './service-identity';
export type { ServiceIdentity } from './service-identity';
