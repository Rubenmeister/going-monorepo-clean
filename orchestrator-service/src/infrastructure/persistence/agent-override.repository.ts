import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AgentOverrideEntity,
  AgentOverrideDocument,
} from '../schemas/agent-override.schema';

@Injectable()
export class AgentOverrideRepository {
  private readonly logger = new Logger(AgentOverrideRepository.name);

  constructor(
    @InjectModel('AgentOverride')
    private readonly model: Model<AgentOverrideDocument>,
  ) {}

  async findByAgentId(agentId: string): Promise<AgentOverrideEntity | null> {
    return this.model.findOne({ agentId }).lean();
  }

  /** Lista solo los pausados — usado por la UI admin. */
  async listPaused(): Promise<AgentOverrideEntity[]> {
    return this.model.find({ paused: true }).sort({ pausedAt: -1 }).lean();
  }

  /** Lista todos los overrides — incluyendo los unpaused (para auditoría). */
  async listAll(): Promise<AgentOverrideEntity[]> {
    return this.model.find().sort({ agentId: 1 }).lean();
  }

  /**
   * Pausa un agente. Idempotente: si ya estaba pausado, actualiza pausedAt
   * + pausedBy para reflejar la última intervención de ops (útil para
   * trazar "quién es el último responsable" cuando hay turnos rotando).
   */
  async pause(
    agentId: string,
    pausedBy: string,
    pauseReason?: string,
  ): Promise<AgentOverrideEntity> {
    const now = new Date();
    const updated = await this.model
      .findOneAndUpdate(
        { agentId },
        {
          $set: {
            agentId,
            paused: true,
            pausedAt: now,
            pausedBy,
            pauseReason: pauseReason ?? '',
          },
        },
        { upsert: true, new: true },
      )
      .lean();
    this.logger.warn(
      `[override] ${agentId} PAUSED by ${pausedBy} — reason: ${pauseReason ?? 'no reason'}`,
    );
    return updated;
  }

  /**
   * Despausa un agente. Si nunca estuvo pausado, devuelve null (no creamos
   * docs vacíos solo para registrar "no se hizo nada").
   */
  async unpause(
    agentId: string,
    unpausedBy: string,
  ): Promise<AgentOverrideEntity | null> {
    const now = new Date();
    const updated = await this.model
      .findOneAndUpdate(
        { agentId },
        {
          $set: {
            paused: false,
            unpausedAt: now,
            unpausedBy,
          },
        },
        { new: true },
      )
      .lean();
    if (updated) {
      this.logger.log(
        `[override] ${agentId} UNPAUSED by ${unpausedBy} (estuvo pausado desde ${updated.pausedAt?.toISOString() ?? '?'})`,
      );
    }
    return updated;
  }
}
