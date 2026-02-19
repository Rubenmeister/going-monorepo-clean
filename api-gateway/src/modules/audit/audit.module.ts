import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import {
  AuditLogDocument,
  AuditLogSchema,
} from '@going-monorepo-clean/shared-infrastructure';
import { MongoAuditLogRepository } from '@going-monorepo-clean/shared-infrastructure';
import { IAuditLogRepository } from '@going-monorepo-clean/domains-audit-core';
import {
  AuditLogService,
  AuditAnalyticsService,
  RetentionPolicyService,
  GDPRService,
} from '@going-monorepo-clean/domains-audit-application';
import { AuditController } from './audit.controller';

/**
 * AuditModule
 *
 * Self-contained module providing the full audit logging system.
 * Exports AuditLogService so other modules (auth, proxy) can record events.
 *
 * Depends on:
 * - MongoDB (for persistence)
 * - @nestjs/schedule (for retention cron job)
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLogDocument.name, schema: AuditLogSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuditController],
  providers: [
    {
      provide: IAuditLogRepository,
      useClass: MongoAuditLogRepository,
    },
    AuditLogService,
    AuditAnalyticsService,
    RetentionPolicyService,
    GDPRService,
  ],
  exports: [
    AuditLogService,
    AuditAnalyticsService,
  ],
})
export class AuditModule {}
