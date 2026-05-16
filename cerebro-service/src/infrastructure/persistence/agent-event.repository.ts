import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentRunEvent, AgentId } from '@going-platform/cerebro-contracts';
import { AgentEventEntity, AgentEventDocument } from '../schemas/agent-event.schema';

@Injectable()
export class AgentEventRepository {
  private readonly logger = new Logger(AgentEventRepository.name);

  constructor(
    @InjectModel('AgentEvent') private readonly model: Model<AgentEventDocument>,
  ) {}

  /**
   * Persiste un evento. El `runId` tiene índice unique → si llega duplicado
   * (Pub/Sub at-least-once), atrapamos el E11000 y retornamos `false` para
   * que el subscriber pueda ack-ear sin reprocesar.
   */
  async save(event: AgentRunEvent): Promise<boolean> {
    try {
      await this.model.create({
        ...event,
        startedAt:  new Date(event.startedAt),
        finishedAt: new Date(event.finishedAt),
        receivedAt: new Date(),
      });
      return true;
    } catch (err: any) {
      if (err?.code === 11000) {
        this.logger.debug(`Evento duplicado runId=${event.runId} ignorado (idempotencia)`);
        return false;
      }
      throw err;
    }
  }

  /** Últimos N eventos de un agente (ordenados por finishedAt desc). */
  async recentByAgent(agentId: AgentId, limit = 20): Promise<AgentEventEntity[]> {
    return this.model
      .find({ agentId })
      .sort({ finishedAt: -1 })
      .limit(limit)
      .lean();
  }

  /** Últimos N eventos globales (todos los agentes). */
  async recentGlobal(limit = 50): Promise<AgentEventEntity[]> {
    return this.model
      .find({})
      .sort({ finishedAt: -1 })
      .limit(limit)
      .lean();
  }

  /** Conteo de eventos por agente recibidos en la ventana. */
  async countByAgentSince(since: Date): Promise<Record<string, number>> {
    const groups = await this.model.aggregate([
      { $match: { finishedAt: { $gte: since } } },
      { $group: { _id: '$agentId', count: { $sum: 1 } } },
    ]);
    const result: Record<string, number> = {};
    for (const g of groups) result[g._id] = g.count;
    return result;
  }

  /** Anomalías críticas en una ventana — útil para el state placeholder. */
  async criticalAnomaliesSince(since: Date, limit = 20): Promise<AgentEventEntity[]> {
    return this.model
      .find({
        finishedAt: { $gte: since },
        'anomalies.severity': 'critical',
      })
      .sort({ finishedAt: -1 })
      .limit(limit)
      .lean();
  }
}
