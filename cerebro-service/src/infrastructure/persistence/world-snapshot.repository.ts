import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorldSnapshotEntity, WorldSnapshotDocument } from '../schemas/world-snapshot.schema';

@Injectable()
export class WorldSnapshotRepository {
  constructor(
    @InjectModel('WorldSnapshot') private readonly model: Model<WorldSnapshotDocument>,
  ) {}

  async save(snapshot: Omit<WorldSnapshotEntity, 'receivedAt'>): Promise<WorldSnapshotDocument> {
    return this.model.create(snapshot);
  }

  /** El snapshot más reciente (lo que devuelve GET /cerebro/state). */
  async latest(): Promise<WorldSnapshotEntity | null> {
    return this.model.findOne().sort({ generatedAt: -1 }).lean();
  }

  /** Histórico para auditoría / dashboards. */
  async history(limit = 50): Promise<WorldSnapshotEntity[]> {
    return this.model
      .find()
      .sort({ generatedAt: -1 })
      .limit(limit)
      .lean();
  }

  /** Snapshot inmediatamente anterior — para diff detection. */
  async previous(): Promise<WorldSnapshotEntity | null> {
    const docs = await this.model
      .find()
      .sort({ generatedAt: -1 })
      .limit(2)
      .lean();
    return docs.length >= 2 ? docs[1] : null;
  }
}
