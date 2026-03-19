import { Injectable, Inject, Logger } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { Result } from 'neverthrow';
import {
  AuditLog,
  IAuditLogRepository,
} from '@going-monorepo-clean/domains-audit-core';

export interface GdprExportResult {
  userId: string;
  exportedAt: Date;
  recordCount: number;
  data: Record<string, unknown>[];
}

/**
 * GDPRService
 * Implements GDPR compliance for audit log data:
 * - Article 15: Right of access (data export)
 * - Article 17: Right to erasure (delete user logs)
 * IP addresses are anonymised in exports (last two octets masked).
 */
@Injectable()
export class GDPRService {
  private readonly logger = new Logger(GDPRService.name);

  constructor(
    @Inject(IAuditLogRepository)
    private readonly auditRepo: IAuditLogRepository,
  ) {}

  /**
   * Export all audit logs for a user (GDPR Article 15)
   * Returns sanitised data with IP addresses partially masked.
   */
  async exportUserData(
    userId: string,
  ): Promise<Result<GdprExportResult, Error>> {
    try {
      const logsResult = await this.auditRepo.findByUser(userId, 10000);
      if (logsResult.isErr()) {
        return err(logsResult.error);
      }

      const sanitised = logsResult.value.map(log =>
        this.sanitiseLog(log),
      );

      this.logger.log(
        `GDPR export: ${sanitised.length} records for user ${userId}`,
      );

      return ok({
        userId,
        exportedAt: new Date(),
        recordCount: sanitised.length,
        data: sanitised,
      });
    } catch (error) {
      return err(
        new Error(
          `GDPR export failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }

  /**
   * Delete all audit logs for a user (GDPR Article 17 - Right to Erasure)
   * Returns count of deleted records.
   */
  async deleteUserData(userId: string): Promise<Result<number, Error>> {
    try {
      const result = await this.auditRepo.deleteByUser(userId);
      if (result.isErr()) {
        return err(result.error);
      }

      this.logger.log(
        `GDPR erasure: deleted ${result.value} audit records for user ${userId}`,
      );

      return ok(result.value);
    } catch (error) {
      return err(
        new Error(
          `GDPR erasure failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }

  /**
   * Anonymise an individual audit log for export.
   * - userId replaced with masked value
   * - IP address last two octets masked
   * - Sensitive metadata fields removed
   */
  private sanitiseLog(log: AuditLog): Record<string, unknown> {
    const primitives = log.toPrimitives();
    return {
      ...primitives,
      userId: this.maskUserId(log.userId),
      ipAddress: this.maskIp(log.ipAddress),
      // Remove any raw token / password data from metadata
      metadata: this.sanitiseMetadata(log.metadata),
    };
  }

  private maskUserId(userId: string): string {
    if (userId.length <= 8) return '***';
    return `${userId.substring(0, 4)}****${userId.substring(userId.length - 4)}`;
  }

  private maskIp(ip: string): string {
    // IPv4: 192.168.1.100 → 192.168.*.*
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return parts.length === 4
        ? `${parts[0]}.${parts[1]}.*.*`
        : '***';
    }
    // IPv6: mask everything after first segment
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return `${parts[0]}:****`;
    }
    return '***';
  }

  private sanitiseMetadata(
    metadata?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!metadata) return undefined;
    const sensitive = new Set(['password', 'token', 'secret', 'key', 'authorization']);
    return Object.fromEntries(
      Object.entries(metadata).filter(
        ([k]) => !sensitive.has(k.toLowerCase()),
      ),
    );
  }
}
