import { Injectable, Inject, Logger } from '@nestjs/common';
import { ok } from 'neverthrow';
import {
  AuditLog,
  AuditActionType,
  ResourceType,
  AuditResult,
  FieldChange,
  IAuditLogRepository,
  AuditLogFilter,
} from '@going-monorepo-clean/domains-audit-core';

export interface RecordAuditParams {
  userId: string;
  serviceId: string;
  ipAddress: string;
  action: AuditActionType;
  resourceType: ResourceType;
  resourceId: string;
  result: AuditResult;
  duration: number;
  errorMessage?: string;
  changes?: FieldChange[];
  metadata?: Record<string, unknown>;
}

/**
 * AuditLogService
 * Core service for recording and querying audit events.
 *
 * Design principle: NEVER throw or block the main request flow.
 * All audit errors are caught and logged internally.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @Inject(IAuditLogRepository)
    private readonly auditRepo: IAuditLogRepository,
  ) {}

  /**
   * Record any audit event (success or failure)
   * Never throws - swallows all errors to protect main flow
   */
  async record(params: RecordAuditParams): Promise<void> {
    try {
      const logResult = AuditLog.create({
        userId: params.userId,
        serviceId: params.serviceId,
        ipAddress: params.ipAddress,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        result: params.result,
        duration: params.duration,
        timestamp: new Date(),
        errorMessage: params.errorMessage,
        changes: params.changes,
        metadata: params.metadata,
      });

      if (logResult.isErr()) {
        this.logger.warn(`Invalid audit log params: ${logResult.error.message}`);
        return;
      }

      const saveResult = await this.auditRepo.save(logResult.value);
      if (saveResult.isErr()) {
        this.logger.error(`Failed to save audit log: ${saveResult.error.message}`);
      }
    } catch (error) {
      // Audit failures must never propagate
      this.logger.error(
        `Unexpected audit error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Convenience: record a successful action */
  async recordSuccess(
    userId: string,
    serviceId: string,
    ipAddress: string,
    action: AuditActionType,
    resourceType: ResourceType,
    resourceId: string,
    duration: number,
    changes?: FieldChange[],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    return this.record({
      userId,
      serviceId,
      ipAddress,
      action,
      resourceType,
      resourceId,
      result: 'success',
      duration,
      changes,
      metadata,
    });
  }

  /** Convenience: record a failed action */
  async recordFailure(
    userId: string,
    serviceId: string,
    ipAddress: string,
    action: AuditActionType,
    resourceType: ResourceType,
    resourceId: string,
    duration: number,
    errorMessage: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    return this.record({
      userId,
      serviceId,
      ipAddress,
      action,
      resourceType,
      resourceId,
      result: 'failure',
      duration,
      errorMessage,
      metadata,
    });
  }

  /** Query: get user's activity in a date range */
  async getUserActivity(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit = 100,
  ) {
    return this.auditRepo.findByUserAndDateRange(userId, startDate, endDate, limit);
  }

  /** Query: get change history for a resource */
  async getResourceHistory(
    resourceType: ResourceType,
    resourceId: string,
    limit = 50,
  ) {
    return this.auditRepo.findByResource(resourceType, resourceId, limit);
  }

  /** Query: flexible filter */
  async query(filter: AuditLogFilter) {
    return this.auditRepo.findByFilter(filter);
  }
}
