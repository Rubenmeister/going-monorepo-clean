import { Injectable, Logger } from '@nestjs/common';

export type AuditAction =
  | 'portal_subscribed'
  | 'portal_unsubscribed'
  | 'trip_tracking_started'
  | 'trip_tracking_ended'
  | 'location_viewed'
  | 'consent_granted'
  | 'consent_revoked'
  | 'booking_approved'
  | 'booking_rejected'
  | 'invoice_viewed'
  | 'report_exported'
  | 'sso_login'
  | 'sso_login_failed'
  | 'mfa_verified'
  | 'mfa_failed'
  | 'user_invited'
  | 'user_suspended'
  | 'spending_limit_changed';

export interface AuditLogEntry {
  action: AuditAction;
  actorId: string;
  actorEmail?: string;
  companyId: string;
  targetUserId?: string;
  bookingId?: string;
  service: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit Log Service
 *
 * Persists security-relevant events to the audit_logs collection.
 * Required for LOPD Ecuador compliance — particularly for:
 * - Who accessed which employee's location
 * - When consent was granted or revoked
 * - All authentication events
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  // Retention periods (months) — configurable per company
  private readonly DEFAULT_RETENTION_MONTHS = 24;

  /**
   * Record an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const logId = this.generateLogId();
      const now = new Date();
      const expiresAt = this.calculateExpiry(now);

      const record = {
        logId,
        ...entry,
        timestamp: now,
        expiresAt,
      };

      // Persist to MongoDB
      // await this.mongoService.insertOne('audit_logs', record);

      // Always mirror to structured logger so it appears in log aggregators
      // (Datadog, CloudWatch, ELK, etc.) even if DB write fails
      this.logger.log(
        `AUDIT | ${entry.action} | company=${entry.companyId} actor=${entry.actorId}` +
          (entry.targetUserId ? ` target=${entry.targetUserId}` : '') +
          (entry.bookingId ? ` booking=${entry.bookingId}` : '')
      );
    } catch (error) {
      // Audit log failures must NEVER break the main flow —
      // but they should be very loudly visible.
      this.logger.error(
        `AUDIT LOG WRITE FAILED: ${JSON.stringify(entry)}`,
        error
      );
    }
  }

  /**
   * Log a tracking access event (specific helper for LOPD)
   */
  async logTrackingAccess(opts: {
    viewerUserId: string;
    viewerEmail: string;
    companyId: string;
    targetUserId: string;
    bookingId: string;
    ipAddress?: string;
  }) {
    await this.log({
      action: 'location_viewed',
      actorId: opts.viewerUserId,
      actorEmail: opts.viewerEmail,
      companyId: opts.companyId,
      targetUserId: opts.targetUserId,
      bookingId: opts.bookingId,
      service: 'corporate-tracking',
      ipAddress: opts.ipAddress,
      metadata: { viewed_at: new Date().toISOString() },
    });
  }

  /**
   * Log a consent event
   */
  async logConsent(opts: {
    userId: string;
    companyId: string;
    bookingId: string;
    granted: boolean;
    ipAddress?: string;
    deviceId?: string;
  }) {
    await this.log({
      action: opts.granted ? 'consent_granted' : 'consent_revoked',
      actorId: opts.userId,
      companyId: opts.companyId,
      bookingId: opts.bookingId,
      targetUserId: opts.userId,
      service: 'mobile-user-app',
      ipAddress: opts.ipAddress,
      metadata: { deviceId: opts.deviceId },
    });
  }

  /**
   * Query audit logs for a company (used in compliance reports)
   */
  async queryLogs(
    companyId: string,
    opts?: {
      actorId?: string;
      targetUserId?: string;
      action?: AuditAction;
      from?: Date;
      to?: Date;
      limit?: number;
    }
  ): Promise<any[]> {
    const query: Record<string, unknown> = { companyId };
    if (opts?.actorId) query.actorId = opts.actorId;
    if (opts?.targetUserId) query.targetUserId = opts.targetUserId;
    if (opts?.action) query.action = opts.action;
    if (opts?.from || opts?.to) {
      query.timestamp = {
        ...(opts.from ? { $gte: opts.from } : {}),
        ...(opts.to ? { $lte: opts.to } : {}),
      };
    }

    // const logs = await this.mongoService.find('audit_logs', query, 0, opts?.limit ?? 100);
    // return logs;
    return [];
  }

  private generateLogId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private calculateExpiry(from: Date): Date {
    const expiry = new Date(from);
    expiry.setMonth(expiry.getMonth() + this.DEFAULT_RETENTION_MONTHS);
    return expiry;
  }
}
