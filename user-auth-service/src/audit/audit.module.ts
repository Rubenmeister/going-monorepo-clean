import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AuditLogDocument,
  AuditLogSchema,
  MongoAuditLogRepository,
} from '@going-monorepo-clean/shared-infrastructure';
import { IAuditLogRepository } from '@going-monorepo-clean/domains-audit-core';
import { AuditLogService } from '@going-monorepo-clean/domains-audit-application';

/**
 * AuditModule (user-auth-service)
 *
 * Lightweight module that wires the AuditLogService used by AuthController.
 * Shares the same MongoDB connection as the user service.
 * The full analytics / retention / GDPR features live in the api-gateway AuditModule.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLogDocument.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [
    {
      provide: IAuditLogRepository,
      useClass: MongoAuditLogRepository,
    },
    AuditLogService,
  ],
  exports: [AuditLogService],
})
export class AuditModule {}
