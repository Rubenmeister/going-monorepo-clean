import { Injectable, Logger } from '@nestjs/common';
import {
  AgentRunEvent,
  AgentRunEventSchema,
} from '@going-platform/cerebro-contracts';
import { AgentEventRepository } from './persistence/agent-event.repository';

/**
 * Handler único para los eventos que recibe cualquier subscriber.
 *
 * Responsabilidades en Fase 1 (skeleton):
 *   1. Validar shape con Zod (defensivo — un agente con bug podría publicar basura).
 *   2. Persistir en cerebro_agent_events (TTL 30d, idempotente por runId).
 *   3. Loggear métricas + anomalías para debug visual durante bring-up.
 *
 * Fase 2: feedear el world model con cada evento.
 * Fase 3: trigger del Orchestrator si hay anomalías críticas.
 * Fase 4: feedear MyCortex con el evento + world model contextual.
 */
@Injectable()
export class EventHandlerService {
  private readonly logger = new Logger(EventHandlerService.name);

  constructor(private readonly repo: AgentEventRepository) {}

  /**
   * Procesa un mensaje JSON crudo del bus. Devuelve true si fue procesado
   * exitosamente (puede ack-ear), false si hubo error transient (debe nack
   * para reintento) o si el evento fue rechazado por shape inválido.
   *
   * En este último caso devolvemos true igual — un mensaje malformado no
   * debe quedarse para siempre re-deliver-ándose; mejor descartar y alertar.
   */
  async handle(rawJson: unknown, meta: { topicName?: string } = {}): Promise<boolean> {
    // 1. Validar shape
    const parsed = AgentRunEventSchema.safeParse(rawJson);
    if (!parsed.success) {
      this.logger.warn(
        `Evento inválido descartado (topic=${meta.topicName ?? 'unknown'}): ` +
          `${JSON.stringify(parsed.error.issues).slice(0, 500)}`,
      );
      // Ack para sacar el msg del bus — el problema es upstream y no se
      // resuelve reintentando.
      return true;
    }

    const event = parsed.data as AgentRunEvent;

    // 2. Persistir (idempotente)
    let inserted: boolean;
    try {
      inserted = await this.repo.save(event);
    } catch (err) {
      this.logger.error(
        `Mongo write falló para ${event.agentId}/${event.runId}: ${(err as Error).message}`,
      );
      // Transient → nack para que Pub/Sub reintente.
      return false;
    }

    // 3. Log para visibilidad durante bring-up
    if (inserted) {
      const critical = event.anomalies.filter(a => a.severity === 'critical').length;
      const warnings = event.anomalies.filter(a => a.severity === 'warning').length;
      this.logger.log(
        `[${event.agentId}] run ${event.runId.slice(0, 8)} status=${event.status} ` +
          `metrics=${Object.keys(event.metrics).length} ` +
          `anomalies=${event.anomalies.length} (${critical}🚨 ${warnings}⚠️) ` +
          `actionsTaken=${event.actionsTaken.length} ` +
          `actionsProposed=${event.actionsProposed.length} ` +
          `duration=${event.durationMs}ms`,
      );

      if (critical > 0) {
        for (const a of event.anomalies.filter(a => a.severity === 'critical')) {
          this.logger.warn(`  🚨 [${event.agentId}] ${a.type}: ${a.message}`);
        }
      }
    } else {
      this.logger.debug(`[${event.agentId}] run ${event.runId.slice(0, 8)} duplicado, ack`);
    }

    return true;
  }
}
