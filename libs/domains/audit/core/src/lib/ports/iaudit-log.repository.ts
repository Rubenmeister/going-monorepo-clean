import { Result } from 'neverthrow';
import { AuditLog, AuditActionType, ResourceType, AuditResult } from '../entities/audit-log.entity';

export const IAuditLogRepository = Symbol('IAuditLogRepository');

export interface AuditLogFilter {
  userId?: string;
  action?: AuditActionType;
  resourceType?: ResourceType;
  resourceId?: string;
  result?: AuditResult;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface IAuditLogRepository {
  save(log: AuditLog): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<AuditLog | null, Error>>;
  findByFilter(filter: AuditLogFilter): Promise<Result<AuditLog[], Error>>;
  findByUser(userId: string, limit?: number): Promise<Result<AuditLog[], Error>>;
  findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit?: number,
  ): Promise<Result<AuditLog[], Error>>;
  findByResource(
    resourceType: ResourceType,
    resourceId: string,
    limit?: number,
  ): Promise<Result<AuditLog[], Error>>;
  findRecent(limit: number): Promise<Result<AuditLog[], Error>>;
  findFailures(since: Date, limit?: number): Promise<Result<AuditLog[], Error>>;
  deleteByUser(userId: string): Promise<Result<number, Error>>;
  deleteOlderThan(date: Date, resourceType?: ResourceType): Promise<Result<number, Error>>;
  countByUser(userId: string, since: Date): Promise<Result<number, Error>>;
}
