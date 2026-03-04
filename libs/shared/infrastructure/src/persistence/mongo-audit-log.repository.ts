import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ok, err } from 'neverthrow';
import { Result } from 'neverthrow';
import {
  AuditLog,
  IAuditLogRepository,
  AuditLogFilter,
  ResourceType,
} from '@going-monorepo-clean/domains-audit-core';
import { AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class MongoAuditLogRepository implements IAuditLogRepository {
  private readonly logger = new Logger(MongoAuditLogRepository.name);

  constructor(
    @InjectModel(AuditLogDocument.name)
    private readonly model: Model<AuditLogDocument>
  ) {}

  async save(log: AuditLog): Promise<Result<void, Error>> {
    try {
      const primitives = log.toPrimitives();
      await this.model.create(primitives);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save audit log: ${message}`);
      return err(new Error(message));
    }
  }

  async findById(id: string): Promise<Result<AuditLog | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).lean().exec();
      if (!doc) return ok(null);
      return ok(AuditLog.fromPrimitives(doc as any));
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }

  async findByFilter(
    filter: AuditLogFilter
  ): Promise<Result<AuditLog[], Error>> {
    try {
      const query: Record<string, unknown> = {};

      if (filter.userId) query['userId'] = filter.userId;
      if (filter.action) query['action'] = filter.action;
      if (filter.resourceType) query['resourceType'] = filter.resourceType;
      if (filter.resourceId) query['resourceId'] = filter.resourceId;
      if (filter.result) query['result'] = filter.result;

      if (filter.startDate || filter.endDate) {
        query['timestamp'] = {
          ...(filter.startDate && { $gte: filter.startDate }),
          ...(filter.endDate && { $lte: filter.endDate }),
        };
      }

      const limit = Math.min(filter.limit ?? 100, 1000);
      const skip = filter.offset ?? 0;

      const docs = await this.model
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      return ok(docs.map((d) => AuditLog.fromPrimitives(d as any)));
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }

  async findByUser(
    userId: string,
    limit = 100
  ): Promise<Result<AuditLog[], Error>> {
    return this.findByFilter({ userId, limit });
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit = 100
  ): Promise<Result<AuditLog[], Error>> {
    return this.findByFilter({ userId, startDate, endDate, limit });
  }

  async findByResource(
    resourceType: ResourceType,
    resourceId: string,
    limit = 50
  ): Promise<Result<AuditLog[], Error>> {
    return this.findByFilter({ resourceType, resourceId, limit });
  }

  async findRecent(limit: number): Promise<Result<AuditLog[], Error>> {
    try {
      const docs = await this.model
        .find()
        .sort({ timestamp: -1 })
        .limit(Math.min(limit, 200))
        .lean()
        .exec();
      return ok(docs.map((d) => AuditLog.fromPrimitives(d as any)));
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }

  async findFailures(
    since: Date,
    limit = 50
  ): Promise<Result<AuditLog[], Error>> {
    return this.findByFilter({
      result: 'failure',
      startDate: since,
      limit,
    });
  }

  async deleteByUser(userId: string): Promise<Result<number, Error>> {
    try {
      const result = await this.model.deleteMany({ userId }).exec();
      return ok(result.deletedCount ?? 0);
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }

  async deleteOlderThan(
    date: Date,
    resourceType?: ResourceType
  ): Promise<Result<number, Error>> {
    try {
      const query: Record<string, unknown> = { timestamp: { $lt: date } };
      if (resourceType) query['resourceType'] = resourceType;

      const result = await this.model.deleteMany(query).exec();
      return ok(result.deletedCount ?? 0);
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }

  async countByUser(
    userId: string,
    since: Date
  ): Promise<Result<number, Error>> {
    try {
      const count = await this.model
        .countDocuments({ userId, timestamp: { $gte: since } })
        .exec();
      return ok(count);
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }
}
