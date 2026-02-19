import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/guards/roles.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { CurrentUser } from '@going-monorepo-clean/shared-infrastructure';
import { AuditLogService } from '@going-monorepo-clean/domains-audit-application';
import { AuditAnalyticsService } from '@going-monorepo-clean/domains-audit-application';
import { GDPRService } from '@going-monorepo-clean/domains-audit-application';
import { RetentionPolicyService } from '@going-monorepo-clean/domains-audit-application';
import { AuditQueryDto } from './dto/audit-query.dto';

/**
 * AuditController
 *
 * Admin-only endpoints for querying audit logs and GDPR operations.
 *
 * All routes require:
 * - Valid JWT (@UseGuards(JwtAuthGuard))
 * - Role 'admin' (@Roles('admin'))
 *
 * Endpoints:
 *   GET  /admin/audit/recent            - Latest N audit events
 *   GET  /admin/audit/search            - Flexible filter query
 *   GET  /admin/audit/failures          - Failed operations
 *   GET  /admin/audit/user/:userId      - User activity timeline
 *   GET  /admin/audit/user/:userId/summary  - User activity summary
 *   GET  /admin/audit/resource/:type/:id  - Resource change history
 *   POST /admin/audit/retention/run     - Manual retention cleanup
 *   POST /admin/audit/gdpr/:userId/export  - GDPR data export
 *   DELETE /admin/audit/gdpr/:userId    - GDPR data erasure
 */
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly auditAnalyticsService: AuditAnalyticsService,
    private readonly gdprService: GDPRService,
    private readonly retentionService: RetentionPolicyService,
  ) {}

  /**
   * GET /admin/audit/recent?limit=20
   * Returns the N most recent audit events (default 20, max 200)
   */
  @Get('recent')
  async getRecent(@Query('limit') limit = 20) {
    const result = await this.auditAnalyticsService.getRecentEvents(
      Math.min(Number(limit), 200),
    );
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value.map(l => l.toPrimitives());
  }

  /**
   * GET /admin/audit/search?userId=...&action=LOGIN&result=failure&startDate=...
   * Flexible filter query over all audit logs
   */
  @Get('search')
  async search(@Query() dto: AuditQueryDto) {
    const result = await this.auditLogService.query({
      userId: dto.userId,
      action: dto.action as any,
      resourceType: dto.resourceType as any,
      resourceId: dto.resourceId,
      result: dto.result,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      limit: dto.limit,
      offset: dto.offset,
    });
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value.map(l => l.toPrimitives());
  }

  /**
   * GET /admin/audit/failures?days=7&limit=50
   * Returns failed operations in the last N days
   */
  @Get('failures')
  async getFailures(
    @Query('days') days = 7,
    @Query('limit') limit = 50,
  ) {
    const result = await this.auditAnalyticsService.getRecentFailures(
      Number(days),
      Math.min(Number(limit), 200),
    );
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value.map(l => l.toPrimitives());
  }

  /**
   * GET /admin/audit/user/:userId?days=30&limit=100
   * Returns a user's full activity timeline
   */
  @Get('user/:userId')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('days') days = 30,
    @Query('limit') limit = 100,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const result = await this.auditLogService.getUserActivity(
      userId,
      startDate,
      new Date(),
      Math.min(Number(limit), 1000),
    );
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value.map(l => l.toPrimitives());
  }

  /**
   * GET /admin/audit/user/:userId/summary?days=30
   * Returns aggregated activity statistics for a user
   */
  @Get('user/:userId/summary')
  async getUserSummary(
    @Param('userId') userId: string,
    @Query('days') days = 30,
  ) {
    const result = await this.auditAnalyticsService.getUserActivitySummary(
      userId,
      Number(days),
    );
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value;
  }

  /**
   * GET /admin/audit/user/:userId/logins?days=30
   * Returns login history for a user
   */
  @Get('user/:userId/logins')
  async getUserLoginHistory(
    @Param('userId') userId: string,
    @Query('days') days = 30,
  ) {
    const result = await this.auditAnalyticsService.getUserLoginHistory(
      userId,
      Number(days),
    );
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value.map(l => l.toPrimitives());
  }

  /**
   * GET /admin/audit/resource/:type/:id?limit=50
   * Returns full change history for a specific resource
   */
  @Get('resource/:type/:id')
  async getResourceHistory(
    @Param('type') resourceType: string,
    @Param('id') resourceId: string,
    @Query('limit') limit = 50,
  ) {
    const result = await this.auditLogService.getResourceHistory(
      resourceType as any,
      resourceId,
      Math.min(Number(limit), 200),
    );
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value.map(l => l.toPrimitives());
  }

  // ─── GDPR Endpoints ───────────────────────────────────────────────────────

  /**
   * POST /admin/audit/gdpr/:userId/export
   * Export all audit data for a user (GDPR Article 15)
   * Returns JSON with anonymised IP addresses
   */
  @Post('gdpr/:userId/export')
  @HttpCode(HttpStatus.OK)
  async exportUserData(
    @Param('userId') userId: string,
    @CurrentUser('userId') requestingAdmin: string,
  ) {
    this.logger.log(
      `GDPR export requested for user ${userId} by admin ${requestingAdmin}`,
    );

    const result = await this.gdprService.exportUserData(userId);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value;
  }

  /**
   * DELETE /admin/audit/gdpr/:userId
   * Delete all audit logs for a user (GDPR Article 17 - Right to Erasure)
   */
  @Delete('gdpr/:userId')
  @HttpCode(HttpStatus.OK)
  async deleteUserData(
    @Param('userId') userId: string,
    @CurrentUser('userId') requestingAdmin: string,
  ) {
    this.logger.log(
      `GDPR erasure requested for user ${userId} by admin ${requestingAdmin}`,
    );

    const result = await this.gdprService.deleteUserData(userId);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return {
      message: 'User audit logs deleted successfully',
      deletedCount: result.value,
    };
  }

  // ─── Retention Policy ─────────────────────────────────────────────────────

  /**
   * POST /admin/audit/retention/run
   * Manually trigger the retention cleanup job
   */
  @Post('retention/run')
  @HttpCode(HttpStatus.OK)
  async runRetention(@CurrentUser('userId') adminId: string) {
    this.logger.log(`Manual retention cleanup triggered by admin ${adminId}`);
    const result = await this.retentionService.triggerManualCleanup();
    return { message: 'Retention cleanup completed', ...result };
  }
}
