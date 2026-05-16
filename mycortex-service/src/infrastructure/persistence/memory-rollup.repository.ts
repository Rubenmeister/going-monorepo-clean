import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemoryRollupDocument, MemoryRollupEntity } from '../schemas/memory-rollup.schema';

@Injectable()
export class MemoryRollupRepository {
  constructor(
    @InjectModel('MemoryRollup') private readonly model: Model<MemoryRollupDocument>,
  ) {}

  /**
   * Upsert por weekStarting — re-correr el cron sobrescribe el último doc
   * sin duplicar. Útil cuando un retry del cron se dispara o cuando se
   * regenera manualmente.
   */
  async save(rollup: Omit<MemoryRollupEntity, 'generatedAt'>): Promise<MemoryRollupDocument> {
    const updated = await this.model.findOneAndUpdate(
      { weekStarting: rollup.weekStarting },
      { $set: { ...rollup, generatedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (!updated) {
      throw new Error('MemoryRollupRepository.save: returned null');
    }
    return updated;
  }

  /**
   * Devuelve los últimos N rollups (más recientes primero).
   * Usado por el prompt builder — incluye los últimos 4 (= ~mes pasado).
   */
  async recent(limit = 4): Promise<MemoryRollupEntity[]> {
    return this.model
      .find()
      .sort({ weekStarting: -1 })
      .limit(limit)
      .lean();
  }
}
