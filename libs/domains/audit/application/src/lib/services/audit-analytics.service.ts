import { Injectable, Inject, Logger } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { Result } from 'neverthrow';
import {
  AuditLog,
  IAuditLogRepository,
  AuditActionType,
} from '@going-monorepo-clean/domains-audit-core';

export interface UserActivitySummary {
  userId: string;
  totalActions: number;
  successCount: number;
  failureCount: number;
  actionBreakdown: Record<string, number>;
  lastActivity: Date | null;
  uniqueIps: string[];
}

export interface SystemHealthSummary {
  totalLogsLast24h: number;
  failureRateLast24h: number;
  topFailingActions: Array<{ action: string; count: number }>;
  topActiveUsers: Array<{ userId: string; count: number }>;
}

/**
 * AuditAnalyticsService
 * Provides aggregated views and reporting over audit log data.
 */
@Injectable()
export class AuditAnalyticsService {
  private readonly logger = new Logger(AuditAnalyticsService.name);

  constructor(
    @Inject(IAuditLogRepository)
    private readonly auditRepo: IAuditLogRepository,
  ) {}

  /** Get recent audit events (for admin dashboard feed) */
  async getRecentEvents(limit = 20): Promise<Result<AuditLog[], Error>> {
    return this.auditRepo.findRecent(limit);
  }

  /** Get failed operations since a given date */
  async getRecentFailures(
    days = 7,
    limit = 50,
  ): Promise<Result<AuditLog[], Error>> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.auditRepo.findFailures(since, limit);
  }

  /** Summarise a single user's activity over last N days */
  async getUserActivitySummary(
    userId: string,
    days = 30,
  ): Promise<Result<UserActivitySummary, Error>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logsResult = await this.auditRepo.findByUserAndDateRange(
      userId,
      startDate,
      new Date(),
      1000,
    );

    if (logsResult.isErr()) {
      return err(logsResult.error);
    }

    const logs = logsResult.value;

    const actionBreakdown: Record<string, number> = {};
    const ipSet = new Set<string>();
    let successCount = 0;
    let failureCount = 0;
    let lastActivity: Date | null = null;

    for (const log of logs) {
      actionBreakdown[log.action] = (actionBreakdown[log.action] ?? 0) + 1;
      ipSet.add(log.ipAddress);

      if (log.result === 'success') successCount++;
      else failureCount++;

      if (!lastActivity || log.timestamp > lastActivity) {
        lastActivity = log.timestamp;
      }
    }

    return ok({
      userId,
      totalActions: logs.length,
      successCount,
      failureCount,
      actionBreakdown,
      lastActivity,
      uniqueIps: Array.from(ipSet),
    });
  }

  /** Get login activity for a user (last N days) */
  async getUserLoginHistory(
    userId: string,
    days = 30,
  ): Promise<Result<AuditLog[], Error>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.auditRepo.findByFilter({
      userId,
      action: 'LOGIN' as AuditActionType,
      startDate,
      endDate: new Date(),
      limit: 100,
    });
  }
}
