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
  // Read-only por naturaleza — accionables vía force_check para re-correr
  // su monitor on-demand. Acciones write futuras (sentry resolve, vercel
  // redeploy) se agregan acá cuando se necesiten.
  'mobile-agent': {
    kind:    'cloud-run-job',
    jobName: 'mobile-agent',
  },
  'frontend-agent': {
    kind:    'cloud-run-job',
    jobName: 'frontend-agent',
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

  // Uyari — voice-call-service: acepta comandos como block_caller_temporarily,
  // update_voice_agent_prompt, force_handoff_current_call (todos en scaffold
  // hoy — implementar cuando se active el feature Twilio).
  'voice-call-service': {
    kind:        'http-service',
    serviceUrl:  process.env.VOICE_CALL_SERVICE_URL ||
                 'https://voice-call-service-780842550857.us-central1.run.app',
    commandPath: '/voice/command',
  },
};

export function lookupAgent(agentId: string): AgentConfig | null {
  return AGENT_REGISTRY[agentId] ?? null;
}
