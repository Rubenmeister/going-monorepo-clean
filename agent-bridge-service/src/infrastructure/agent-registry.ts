/**
 * Registry de cómo despachar a cada agente.
 *
 * Going tiene 2 tipos de agents:
 *  - **Cron Job** (Cloud Run Jobs): se invocan via Cloud Run Jobs Execute API.
 *    Args se pasan como env var override (`COMMAND_JSON`).
 *  - **HTTP Service** (always-on): se invocan via POST a un endpoint propio
 *    del service (ej: customer-support-service expone /support/command).
 *
 * El registry mapea agentId → kind + config. El BridgeController consulta
 * esto y ruta al ejecutor correspondiente.
 */

export type AgentKind = 'cloud-run-job' | 'http-service';

export interface AgentConfig {
  kind:    AgentKind;
  /** Para 'cloud-run-job': el job name en Cloud Run. */
  jobName?: string;
  /** Para 'http-service': URL base + path del endpoint /command. */
  serviceUrl?: string;
  /** Path relativo al endpoint de command (default '/command'). */
  commandPath?: string;
}

export const AGENT_REGISTRY: Record<string, AgentConfig> = {
  // ── Cron Jobs (Cloud Run Jobs) ────────────────────────────
  'ops-agent': {
    kind:    'cloud-run-job',
    jobName: 'ops-agent',
  },
  'financial-agent': {
    kind:    'cloud-run-job',
    jobName: 'financial-agent',
  },
  'content-agent': {
    kind:    'cloud-run-job',
    jobName: 'content-agent',
  },
  'marketing-agent': {
    kind:    'cloud-run-job',
    jobName: 'marketing-agent',
  },
  'going-agent': {
    kind:    'cloud-run-job',
    jobName: 'going-agent',
  },

  // ── HTTP Services ──────────────────────────────────────────
  'customer-support-service': {
    kind:        'http-service',
    serviceUrl:  process.env.CUSTOMER_SUPPORT_URL ||
                 'https://customer-support-service-780842550857.us-central1.run.app',
    commandPath: '/support/command',
  },

  // cerebro-service puede recibir comandos para anomaly logging, etc.
  'cerebro-service': {
    kind:        'http-service',
    serviceUrl:  process.env.CEREBRO_URL ||
                 'https://cerebro-service-780842550857.us-central1.run.app',
    commandPath: '/cerebro/command',
  },
};

export function lookupAgent(agentId: string): AgentConfig | null {
  return AGENT_REGISTRY[agentId] ?? null;
}
