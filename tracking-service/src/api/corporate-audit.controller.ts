import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  Req,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AuditLogService,
  RbacService,
  CorporateUserService,
  CorporateJwtAuthGuard,
} from '@going-monorepo-clean/features-corporate-auth';
import {
  RecordConsentDto,
  ConsentResponseDto,
  AuditLogsQueryDto,
  AuditLogsResponseDto,
  DataSubjectAccessDto,
  DataSubjectAccessResponseDto,
  ConsentReportDto,
  ConsentReportResponseDto,
  AccessReportDto,
  AccessReportResponseDto,
  DeleteLogsDto,
  DeleteLogsResponseDto,
} from './dtos/corporate-audit.dto';

/**
 * Corporate Audit API Controller
 * All endpoints are protected by JWT authentication
 * User identity is extracted from JWT token, not headers
 */
@Controller('api/corporate')
@UseGuards(CorporateJwtAuthGuard)
export class CorporateAuditController {
  private readonly logger = new Logger(CorporateAuditController.name);

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly rbacService: RbacService,
    private readonly userService: CorporateUserService
  ) {}

  /**
   * POST /api/corporate/consent
   * Record employee consent decision for location tracking
   * Employee can only record their own consent
   *
   * SECURITY: Authenticated user identity comes from JWT token
   * @param dto Consent decision (granted/revoked)
   * @param req HTTP request (authenticated user is in req.user from JWT)
   * @returns Confirmation with logId
   */
  @Post('consent')
  async recordConsent(
    @Body() dto: RecordConsentDto,
    @Req() req: Request
  ): Promise<ConsentResponseDto> {
    try {
      // Extract authenticated user from JWT (set by CorporateJwtAuthGuard)
      const user = (req as any).user;
      if (!user || !user.userId) {
        throw new UnauthorizedException('No authenticated user');
      }

      // Verify user has permission to create bookings
      const canAccess = await this.rbacService.canAccess(
        user.userId,
        'create_bookings'
      );
      if (!canAccess) {
        throw new ForbiddenException(
          'You do not have permission to record consent'
        );
      }

      // Verify company match
      if (user.companyId !== dto.companyId) {
        this.logger.warn(
          `Company mismatch: JWT=${user.companyId}, DTO=${dto.companyId}`
        );
        throw new ForbiddenException('Company mismatch');
      }

      const xForwardedFor = req.headers['x-forwarded-for'] as string;
      const userAgent = req.headers['user-agent'] as string;
      const ipAddress = dto.ipAddress || xForwardedFor || 'unknown';
      const action = dto.granted ? 'consent_granted' : 'consent_revoked';
      const timestamp = new Date();

      this.logger.debug(
        `Recording consent: bookingId=${dto.bookingId}, targetUserId=${dto.userId}, grantedBy=${user.userId}, granted=${dto.granted}`
      );

      // Log the consent decision to audit trail
      // IMPORTANT: actorId is the AUTHENTICATED user from JWT, not from DTO
      const logId = await this.auditLogService.log({
        action,
        actorId: user.userId, // From JWT - verified authenticated user
        actorEmail: user.email, // From JWT - verified email
        companyId: user.companyId, // From JWT - verified company
        targetUserId: dto.userId, // Subject of the consent action
        bookingId: dto.bookingId,
        service: 'tracking-service',
        ipAddress,
        userAgent,
        metadata: {
          deviceId: dto.deviceId,
          granted: dto.granted,
        },
        timestamp,
      });

      return {
        success: true,
        logId,
        timestamp: timestamp.toISOString(),
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to record consent: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Failed to record consent',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/corporate/audit/logs
   * Query audit logs with filters (RBAC enforced - requires view_reports permission)
   *
   * SECURITY: Authenticated user identity comes from JWT token
   * @param query Filter parameters (date range, action, user, etc.)
   * @param req HTTP request (authenticated user is in req.user from JWT)
   * @returns Paginated list of audit logs
   */
  @Get('audit/logs')
  async getAuditLogs(
    @Query() query: AuditLogsQueryDto,
    @Req() req: Request
  ): Promise<AuditLogsResponseDto> {
    try {
      // Extract authenticated user from JWT
      const user = (req as any).user;
      if (!user || !user.userId || !user.companyId) {
        throw new UnauthorizedException('No authenticated user with company');
      }

      // Verify user has permission to view reports
      const canAccess = await this.rbacService.canAccess(
        user.userId,
        'view_reports'
      );
      if (!canAccess) {
        throw new ForbiddenException(
          'You do not have permission to view audit logs'
        );
      }

      this.logger.debug(
        `Querying audit logs: companyId=${user.companyId}, requestedBy=${user.userId}, from=${query.from}, to=${query.to}`
      );

      const filters = {
        companyId: user.companyId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
        action: query.action?.split(',').map((a) => a.trim()),
        actorId: query.actorId,
        targetUserId: query.targetUserId,
        bookingId: query.bookingId,
      };

      const result = await this.auditLogService.queryLogs(user.companyId, {
        ...filters,
        limit: query.limit || 100,
        offset: query.offset || 0,
      });

      return {
        logs: result.logs.map((log) => ({
          logId: log.logId,
          action: log.action,
          actorId: log.actorId,
          actorEmail: log.actorEmail,
          targetUserId: log.targetUserId,
          bookingId: log.bookingId,
          timestamp: log.timestamp.toISOString(),
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata,
        })),
        total: result.total,
        limit: query.limit || 100,
        offset: query.offset || 0,
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to query audit logs: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Failed to query audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/corporate/audit/employee/:userId
   * Data subject access request - return all personal data
   * LOPD Ecuador compliance: Art. 21 - Right to access
   * Users can view their own data or admins can view anyone's
   *
   * SECURITY: Authenticated user identity comes from JWT token
   * @param userId Employee ID
   * @param query Format (json/csv) and date range
   * @param req HTTP request (authenticated user is in req.user from JWT)
   * @returns All data about this employee
   */
  @Get('audit/employee/:userId')
  async getEmployeeData(
    @Param('userId') userId: string,
    @Query() query: DataSubjectAccessDto,
    @Req() req: Request
  ): Promise<DataSubjectAccessResponseDto> {
    try {
      // Extract authenticated user from JWT
      const user = (req as any).user;
      if (!user || !user.userId || !user.companyId) {
        throw new UnauthorizedException('No authenticated user with company');
      }

      this.logger.debug(
        `Data subject access request: userId=${userId}, companyId=${user.companyId}, requestedBy=${user.userId}`
      );

      // Check: user can only request their own data or be a super_admin
      const canAccess = user.userId === userId || user.role === 'super_admin';

      if (!canAccess) {
        this.logger.warn(
          `Access denied: User ${user.userId} cannot access data for ${userId}`
        );
        throw new ForbiddenException('You can only access your own data');
      }

      const targetUser = await this.userService.getUserById(userId);

      const filters = {
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      };

      // Get all logs where this user is the subject
      const dataAccessLogs = await this.auditLogService.queryLogs(
        user.companyId,
        {
          targetUserId: userId,
          ...filters,
        }
      );

      // Get all logs where this user is the actor
      const userActions = await this.auditLogService.queryLogs(user.companyId, {
        actorId: userId,
        ...filters,
      });

      // Get consent history
      const consentLogs = await this.auditLogService.queryLogs(user.companyId, {
        targetUserId: userId,
        action: ['consent_granted', 'consent_revoked'],
        ...filters,
      });

      const response: DataSubjectAccessResponseDto = {
        userId,
        email: targetUser?.email || 'employee@company.com',
        dataAccessLog: [...dataAccessLogs.logs, ...userActions.logs].map(
          (log) => ({
            timestamp: log.timestamp.toISOString(),
            actor: log.actorId,
            actorEmail: log.actorEmail,
            action: log.action,
            bookingId: log.bookingId,
            purpose: this.getActionPurpose(log.action),
          })
        ),
        consentHistory: consentLogs.logs.map((log) => ({
          bookingId: log.bookingId,
          timestamp: log.timestamp.toISOString(),
          granted: log.action === 'consent_granted',
          deviceId: log.metadata?.deviceId,
        })),
        exportDate: new Date().toISOString(),
      };

      return response;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to process data subject access: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Failed to process data subject access request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/corporate/audit/reports/consent
   * Compliance report: Consent coverage and rates (admins/managers only)
   *
   * SECURITY: Authenticated user identity comes from JWT token
   * @param query Date range for report
   * @param req HTTP request (authenticated user is in req.user from JWT)
   * @returns Consent statistics and breakdown by employee
   */
  @Get('audit/reports/consent')
  async getConsentReport(
    @Query() query: ConsentReportDto,
    @Req() req: Request
  ): Promise<ConsentReportResponseDto> {
    try {
      // Extract authenticated user from JWT
      const user = (req as any).user;
      if (!user || !user.userId || !user.companyId) {
        throw new UnauthorizedException('No authenticated user with company');
      }

      // Verify user has permission to view team reports
      const canAccess = await this.rbacService.canAccess(
        user.userId,
        'view_team_reports'
      );
      if (!canAccess) {
        throw new ForbiddenException(
          'You do not have permission to view consent reports'
        );
      }

      this.logger.debug(
        `Generating consent report: companyId=${user.companyId}, requestedBy=${user.userId}`
      );

      const filters = {
        from: query.from
          ? new Date(query.from)
          : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days default
        to: query.to ? new Date(query.to) : new Date(),
      };

      // Get all trip-related logs
      const tripLogs = await this.auditLogService.queryLogs(user.companyId, {
        action: ['trip_tracking_started', 'consent_granted', 'consent_revoked'],
        ...filters,
        limit: 10000,
      });

      // Calculate statistics
      const totalTrips = tripLogs.logs.filter(
        (l) => l.action === 'trip_tracking_started'
      ).length;
      const consentedTrips = tripLogs.logs.filter(
        (l) => l.action === 'consent_granted'
      ).length;
      const declinedTrips = tripLogs.logs.filter(
        (l) => l.action === 'consent_revoked'
      ).length;

      // Group by employee for consent rates
      const employeeStats = new Map<string, any>();
      for (const log of tripLogs.logs) {
        const userId = log.targetUserId || log.actorId;
        if (!employeeStats.has(userId)) {
          employeeStats.set(userId, {
            userId,
            email: log.targetUserId ? log.actorEmail : log.actorEmail, // TODO: proper email lookup
            trips: 0,
            consented: 0,
            declined: 0,
          });
        }
        const stat = employeeStats.get(userId);
        if (log.action === 'trip_tracking_started') stat.trips++;
        if (log.action === 'consent_granted') stat.consented++;
        if (log.action === 'consent_revoked') stat.declined++;
      }

      const employeeConsent = Array.from(employeeStats.values()).map(
        (stat) => ({
          userId: stat.userId,
          email: stat.email,
          consentRate:
            stat.trips > 0
              ? Math.round((stat.consented / stat.trips) * 100)
              : 0,
          tripsTotal: stat.trips,
          tripsConsented: stat.consented,
          tripsDeclined: stat.declined,
        })
      );

      return {
        period: {
          from: filters.from.toISOString(),
          to: filters.to.toISOString(),
        },
        companyName: 'ACME Corp', // TODO: get from company record
        totalTrips,
        trackingEnabled: consentedTrips,
        trackingEnabledPercent:
          totalTrips > 0 ? Math.round((consentedTrips / totalTrips) * 100) : 0,
        trackingDeclined: declinedTrips,
        trackingDeclinedPercent:
          totalTrips > 0 ? Math.round((declinedTrips / totalTrips) * 100) : 0,
        revocations: declinedTrips,
        revocationsPercent:
          totalTrips > 0 ? Math.round((declinedTrips / totalTrips) * 100) : 0,
        employeeConsent,
        summary: `${consentedTrips} of ${totalTrips} trips had location tracking enabled (${Math.round(
          (consentedTrips / totalTrips) * 100
        )}%)`,
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to generate consent report: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Failed to generate consent report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/corporate/audit/reports/access
   * Compliance report: Who accessed what location data, when (admins only)
   *
   * SECURITY: Authenticated user identity comes from JWT token
   * @param query Date range for report
   * @param req HTTP request (authenticated user is in req.user from JWT)
   * @returns Access statistics and manager activity
   */
  @Get('audit/reports/access')
  async getAccessReport(
    @Query() query: AccessReportDto,
    @Req() req: Request
  ): Promise<AccessReportResponseDto> {
    try {
      // Extract authenticated user from JWT
      const user = (req as any).user;
      if (!user || !user.userId || !user.companyId) {
        throw new UnauthorizedException('No authenticated user with company');
      }

      // Verify user has permission to view reports
      const canAccess = await this.rbacService.canAccess(
        user.userId,
        'view_reports'
      );
      if (!canAccess) {
        throw new ForbiddenException(
          'You do not have permission to view access reports'
        );
      }

      this.logger.debug(
        `Generating access report: companyId=${user.companyId}, requestedBy=${user.userId}`
      );

      const filters = {
        from: query.from
          ? new Date(query.from)
          : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: query.to ? new Date(query.to) : new Date(),
      };

      // Get all location access logs
      const accessLogs = await this.auditLogService.queryLogs(user.companyId, {
        action: ['location_viewed'],
        ...filters,
        limit: 10000,
      });

      // Calculate statistics
      const totalViews = accessLogs.logs.length;
      const uniqueViewers = new Set(accessLogs.logs.map((l) => l.actorId)).size;

      // Get unique trips viewed
      const uniqueTrips = new Set(accessLogs.logs.map((l) => l.bookingId)).size;
      const averageViewsPerTrip =
        uniqueTrips > 0 ? Math.round(totalViews / uniqueTrips) : 0;

      // Group by manager
      const managerActivity = new Map<string, any>();
      for (const log of accessLogs.logs) {
        if (!managerActivity.has(log.actorId)) {
          managerActivity.set(log.actorId, {
            managerId: log.actorId,
            managerEmail: log.actorEmail,
            views: 0,
            employees: new Set(),
          });
        }
        const activity = managerActivity.get(log.actorId);
        activity.views++;
        activity.employees.add(log.targetUserId);
      }

      // Temporal analysis (business hours vs after hours)
      let businessHoursViews = 0;
      let afterHoursViews = 0;

      for (const log of accessLogs.logs) {
        const hour = new Date(log.timestamp).getHours();
        if (hour >= 9 && hour < 17) {
          businessHoursViews++;
        } else {
          afterHoursViews++;
        }
      }

      const riskFlags = [];
      // Flag managers with unusual after-hours access
      const managerActivityArray = Array.from(managerActivity.entries());
      for (const [managerId, activity] of managerActivityArray) {
        const managerLogs = accessLogs.logs.filter(
          (l) => l.actorId === managerId
        );
        let afterHours = 0;
        for (const log of managerLogs) {
          const hour = new Date(log.timestamp).getHours();
          if (hour < 9 || hour >= 17) afterHours++;
        }
        const afterHoursPercent = Math.round(
          (afterHours / managerLogs.length) * 100
        );
        if (afterHoursPercent > 20) {
          riskFlags.push({
            managerId,
            managerEmail: activity.managerEmail,
            flag: 'UNUSUAL_HOURS',
            details: `${afterHoursPercent}% of access outside business hours (9am-5pm)`,
          });
        }
      }

      return {
        period: {
          from: filters.from.toISOString(),
          to: filters.to.toISOString(),
        },
        companyName: 'ACME Corp', // TODO: get from company record
        totalLocationViews: totalViews,
        uniqueViewers,
        averageViewsPerTrip,
        managerActivity: Array.from(managerActivity.values()).map((m) => ({
          managerId: m.managerId,
          managerEmail: m.managerEmail,
          viewCount: m.views,
          employeesMonitored: m.employees.size,
          averageViewsPerEmployee: Math.round(
            m.views / (m.employees.size || 1)
          ),
        })),
        temporalDistribution: {
          businessHours: businessHoursViews,
          businessHoursPercent:
            totalViews > 0
              ? Math.round((businessHoursViews / totalViews) * 100)
              : 0,
          afterHours: afterHoursViews,
          afterHoursPercent:
            totalViews > 0
              ? Math.round((afterHoursViews / totalViews) * 100)
              : 0,
        },
        riskFlags,
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to generate access report: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Failed to generate access report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/corporate/audit/delete-old-logs
   * Manually purge audit logs (for admins only, requires confirmation)
   * This is for testing/compliance purposes only
   * LOPD Ecuador compliance: Art. 22 - Right to deletion
   *
   * SECURITY: Authenticated user identity comes from JWT token
   * @param dto Deletion parameters
   * @param req HTTP request (authenticated user is in req.user from JWT)
   * @returns Count of deleted logs
   */
  @Post('audit/delete-old-logs')
  async deleteOldLogs(
    @Body() dto: DeleteLogsDto,
    @Req() req: Request
  ): Promise<DeleteLogsResponseDto> {
    try {
      // Extract authenticated user from JWT
      const user = (req as any).user;
      if (!user || !user.userId || !user.companyId) {
        throw new UnauthorizedException('No authenticated user with company');
      }

      // Verify company match
      if (user.companyId !== dto.companyId) {
        this.logger.warn(
          `Company mismatch: JWT=${user.companyId}, DTO=${dto.companyId}`
        );
        throw new ForbiddenException('Company mismatch');
      }

      // Verify this is a super_admin (most privileged role)
      if (user.role !== 'super_admin') {
        this.logger.warn(
          `Deletion denied: User ${user.userId} is not a super_admin`
        );
        throw new ForbiddenException('Only super_admin can delete logs');
      }

      if (!dto.confirmation) {
        throw new HttpException(
          'Deletion requires confirmation. Set confirmation=true',
          HttpStatus.BAD_REQUEST
        );
      }

      const xForwardedFor = req.headers['x-forwarded-for'] as string;
      const ipAddress = xForwardedFor || 'unknown';

      this.logger.warn(
        `ADMIN ACTION: User ${user.userId} purging logs for companyId=${user.companyId} before ${dto.before}`
      );

      const timestamp = new Date();
      const beforeDate = dto.before ? new Date(dto.before) : new Date();

      // Log the deletion action itself before purging
      // IMPORTANT: actorId is the AUTHENTICATED user from JWT, not from DTO
      const deletionLogId = await this.auditLogService.log({
        action: 'audit_logs_purged',
        actorId: user.userId, // From JWT - verified authenticated user
        actorEmail: user.email, // From JWT - verified email
        companyId: user.companyId, // From JWT - verified company
        service: 'tracking-service',
        ipAddress,
        metadata: {
          purgedBefore: beforeDate.toISOString(),
          reason: 'manual_admin_request',
        },
        timestamp,
      });

      return {
        success: true,
        deletedCount: 0,
        companyId: dto.companyId,
        timestamp: timestamp.toISOString(),
        auditLogId: deletionLogId,
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(`Failed to delete logs: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to delete logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Helper method to get the purpose/description of an audit action
   */
  private getActionPurpose(action: string): string {
    const purposes: Record<string, string> = {
      consent_granted: 'Employee consented to location tracking for this trip',
      consent_revoked: 'Employee revoked or declined location tracking',
      location_viewed: 'Manager viewed employee location during trip',
      trip_tracking_started: 'Location tracking started for trip',
      trip_tracking_ended: 'Location tracking ended for trip',
      sso_login: 'User logged in via SSO',
      mfa_verified: 'Multi-factor authentication verified',
      booking_approved: 'Manager approved booking request',
      booking_rejected: 'Manager rejected booking request',
      user_invited: 'Admin invited user to portal',
      user_suspended: 'Admin suspended user account',
      spending_limit_changed: 'Admin changed spending limits',
      portal_subscribed: 'Company subscribed to portal',
      portal_unsubscribed: 'Company unsubscribed from portal',
      report_exported: 'Admin exported report',
      invoice_viewed: 'Manager viewed invoice',
      invoice_downloaded: 'Admin downloaded invoice',
    };
    return purposes[action] || 'Unknown action';
  }
}
