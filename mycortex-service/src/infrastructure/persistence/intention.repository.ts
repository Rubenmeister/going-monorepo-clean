import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntentionEntity, IntentionDocument } from '../schemas/intention.schema';

@Injectable()
export class IntentionRepository {
  constructor(
    @InjectModel('Intention') private readonly model: Model<IntentionDocument>,
  ) {}

  async saveMany(items: Omit<IntentionEntity, 'receivedAt' | 'status' | 'outcome'>[]): Promise<IntentionDocument[]> {
    if (items.length === 0) return [];
    return this.model.insertMany(items.map(i => ({
      ...i,
      status: 'proposed',
      outcome: 'unknown',
    })));
  }

  /** Top intenciones del ciclo más reciente, ordenadas por urgency desc. */
  async recentByCycle(cycleId: string, limit = 10): Promise<IntentionEntity[]> {
    return this.model
      .find({ cycleId })
      .sort({ urgency: -1 })
      .limit(limit)
      .lean();
  }

  /** Top N intenciones globales (recientes + pendientes), ordenadas por urgency desc. */
  async topPending(limit = 20): Promise<IntentionEntity[]> {
    return this.model
      .find({ status: 'proposed' })
      .sort({ urgency: -1, receivedAt: -1 })
      .limit(limit)
      .lean();
  }

  /** Histórico para auditoría / dashboard. */
  async recent(limit = 50): Promise<IntentionEntity[]> {
    return this.model
      .find()
      .sort({ receivedAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Marca como expiradas las intenciones cuyo expiresAt ya pasó. Lo llama
   * el cron del reasoning-loop antes de generar nuevas, así no acumula
   * basura en el dashboard.
   */
  async expirePast(now: Date = new Date()): Promise<number> {
    const result = await this.model.updateMany(
      { status: 'proposed', expiresAt: { $lt: now } },
      { $set: { status: 'expired' } },
    );
    return result.modifiedCount ?? 0;
  }
}
