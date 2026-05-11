import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigAuditDocument, ConfigAuditEntity } from '../schemas/config-audit.schema';

@Injectable()
export class ConfigAuditRepository {
  constructor(
    @InjectModel('ConfigAudit') private readonly model: Model<ConfigAuditDocument>,
  ) {}

  async record(args: {
    changedBy:       string;
    changedFields:   string[];
    snapshotBefore?: Record<string, unknown>;
    snapshotAfter:   Record<string, unknown>;
  }): Promise<ConfigAuditDocument> {
    return this.model.create({
      changedBy:      args.changedBy,
      changedAt:      new Date(),
      changedFields:  args.changedFields,
      snapshotBefore: args.snapshotBefore,
      snapshotAfter:  args.snapshotAfter,
    });
  }

  async recent(limit = 50): Promise<ConfigAuditEntity[]> {
    return this.model
      .find()
      .sort({ changedAt: -1 })
      .limit(limit)
      .lean();
  }
}
