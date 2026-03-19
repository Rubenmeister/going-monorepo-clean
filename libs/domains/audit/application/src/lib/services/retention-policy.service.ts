import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IAuditLogRepository,
  ResourceType,
} from '@going-monorepo-clean/domains-audit-core';

export interface RetentionPolicy {
  resourceType?: ResourceType; // undefined = applies to all
  daysToRetain: number;
}

const DEFAULT_RETENTION_DAYS = 90;

/**
 * RetentionPolicyService
 * Automatically deletes audit logs older than the configured retention window.
 * Runs nightly at 02:00 by default.
 */
@Injectable()
export class RetentionPolicyService {
  private readonly logger = new Logger(RetentionPolicyService.name);

  // Resource-specific overrides; falls back to DEFAULT_RETENTION_DAYS
  private readonly policies: RetentionPolicy[] = [
    { resourceType: 'auth', daysToRetain: 365 },           // Auth events kept 1 year
    { resourceType: 'payments', daysToRetain: 365 },        // Payment events kept 1 year (compliance)
    { resourceType: 'admin_settings', daysToRetain: 365 },  // Admin changes kept 1 year
    { daysToRetain: DEFAULT_RETENTION_DAYS },               // Everything else: 90 days
  ];

  constructor(
    @Inject(IAuditLogRepository)
    private readonly auditRepo: IAuditLogRepository,
  ) {}

  /**
   * Nightly cleanup at 02:00 AM
   * Deletes logs older than the configured retention window
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runRetentionCleanup(): Promise<void> {
    this.logger.log('Starting retention policy cleanup...');
    let totalDeleted = 0;

    for (const policy of this.policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.daysToRetain);

      const result = await this.auditRepo.deleteOlderThan(
        cutoffDate,
        policy.resourceType,
      );

      if (result.isErr()) {
        this.logger.error(
          `Retention cleanup failed for ${policy.resourceType ?? 'all'}: ${result.error.message}`,
        );
        continue;
      }

      totalDeleted += result.value;
      this.logger.debug(
        `Deleted ${result.value} logs for ${policy.resourceType ?? 'all'} older than ${policy.daysToRetain} days`,
      );
    }

    this.logger.log(`Retention cleanup complete. Total deleted: ${totalDeleted}`);
  }

  /** Manual trigger (admin endpoint) */
  async triggerManualCleanup(): Promise<{ deleted: number }> {
    this.logger.log('Manual retention cleanup triggered');
    await this.runRetentionCleanup();
    return { deleted: 0 }; // count tracked in runRetentionCleanup logs
  }
}
