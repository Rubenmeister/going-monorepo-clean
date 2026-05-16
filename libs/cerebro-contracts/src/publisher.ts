import { PubSub, Topic } from '@google-cloud/pubsub';
import { AgentRunEvent, AgentRunEventSchema, topicNameForAgent } from './event';

/**
 * Publisher único de eventos `AgentRunEvent` al bus de Pub/Sub.
 *
 * Diseño:
 *  - Cliente Pub/Sub se reusa entre invocaciones (pool de gRPC subyacente).
 *  - Validación con Zod antes de publicar — preferimos fallar local con
 *    error claro a publicar basura que rompe el cerebro-service downstream.
 *  - Si `CEREBRO_PUBLISH_ENABLED=false` o no está seteado, el publish es
 *    no-op pero NO falla. Esto permite habilitar gradualmente cada agente
 *    sin tirar el cron entero si Pub/Sub se cae o el cerebro no está listo.
 *  - El topic se crea LAZY (no asume que exista). En producción los topics
 *    los provisiona Terraform / gcloud antes del primer publish.
 */

let cachedClient: PubSub | null = null;
const cachedTopics = new Map<string, Topic>();

function getClient(projectId?: string): PubSub {
  if (cachedClient) return cachedClient;
  cachedClient = new PubSub({
    projectId: projectId || process.env.GCP_PROJECT,
  });
  return cachedClient;
}

function getTopic(client: PubSub, name: string): Topic {
  const cached = cachedTopics.get(name);
  if (cached) return cached;
  const topic = client.topic(name, {
    // Batching agresivo no aporta — publicamos 1 evento por run.
    batching: { maxMessages: 1, maxMilliseconds: 0 },
  });
  cachedTopics.set(name, topic);
  return topic;
}

export interface PublishOptions {
  /** Override del project ID (default: env GCP_PROJECT). */
  projectId?: string;
  /** Si false (default), publicar es no-op pero loggea. Útil mientras el cerebro no está listo. */
  enabled?: boolean;
  /** Logger opcional — default console. */
  logger?: { log: (msg: string) => void; warn: (msg: string) => void; error: (msg: string, err?: unknown) => void };
}

const defaultLogger = {
  log:   (msg: string) => console.log(`[cerebro-publisher] ${msg}`),
  warn:  (msg: string) => console.warn(`[cerebro-publisher] ${msg}`),
  error: (msg: string, err?: unknown) => console.error(`[cerebro-publisher] ${msg}`, err),
};

/**
 * Publica un AgentRunEvent al topic correspondiente del agente.
 * Devuelve true si el evento se entregó al broker (o si el publish está
 * deshabilitado, en cuyo caso es un no-op exitoso). False si Zod rechazó
 * el shape o Pub/Sub falló.
 */
export async function publishAgentRunEvent(
  event: AgentRunEvent,
  options: PublishOptions = {},
): Promise<boolean> {
  const log = options.logger ?? defaultLogger;

  // 1. Validar shape antes de salir a la red.
  const parsed = AgentRunEventSchema.safeParse(event);
  if (!parsed.success) {
    log.error(
      `Evento inválido para agente ${event.agentId} (run ${event.runId}). ` +
        `Zod errors: ${JSON.stringify(parsed.error.issues, null, 2)}`,
    );
    return false;
  }

  const enabled =
    options.enabled !== undefined
      ? options.enabled
      : process.env.CEREBRO_PUBLISH_ENABLED === 'true';

  if (!enabled) {
    log.log(
      `Publish deshabilitado (CEREBRO_PUBLISH_ENABLED!=true). ` +
        `Evento ${parsed.data.agentId}/${parsed.data.runId} con ` +
        `${parsed.data.anomalies.length} anomalías y ${parsed.data.actionsTaken.length} acciones — no se enviará.`,
    );
    return true;
  }

  // 2. Publicar.
  const topicName = topicNameForAgent(parsed.data.agentId);
  try {
    const client = getClient(options.projectId);
    const topic = getTopic(client, topicName);
    const messageId = await topic.publishMessage({
      json: parsed.data,
      attributes: {
        agentId: parsed.data.agentId,
        runId:   parsed.data.runId,
        status:  parsed.data.status,
      },
    });
    log.log(`Evento ${parsed.data.runId} publicado a ${topicName} (messageId=${messageId})`);
    return true;
  } catch (err) {
    log.error(`Error publicando evento ${parsed.data.runId} a ${topicName}`, err);
    return false;
  }
}
