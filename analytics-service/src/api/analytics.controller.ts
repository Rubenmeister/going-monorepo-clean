/**
 * Analytics REST API Controller
 * Endpoints for KPI queries and report generation
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService } from '../application/services/analytics.service';
import { CorporateJwtAuthGuard } from '../../shared/guards/corporate-jwt.guard';

@Controller('api/analytics')
@UseGuards(CorporateJwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get dashboard KPIs
   * GET /api/analytics/kpis/current
   */
  @Get('kpis/current')
  async getKPIs(@Req() req: any) {
    const companyId = req.user.companyId;
    return this.analyticsService.getDashboardKPIs(companyId);
  }

  /**
   * Calculate and refresh KPIs
   * POST /api/analytics/kpis/refresh
   */
  @Post('kpis/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshKPIs(@Req() req: any) {
    const companyId = req.user.companyId;
    return this.analyticsService.calculateDashboardKPIs(companyId);
  }

  /**
   * Get KPI history
   * GET /api/analytics/kpis/history
   */
  @Get('kpis/history')
  async getKPIHistory(@Query('days') days?: string, @Req() req?: any) {
    const companyId = req.user.companyId;
    return this.analyticsService.getKPIHistory(
      companyId,
      days ? parseInt(days, 10) : 30
    );
  }

  /**
   * Generate report
   * POST /api/analytics/reports
   */
  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  async generateReport(@Body() dto: any, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.sub;

    if (!dto.type || !dto.startDate || !dto.endDate) {
      throw new Error('type, startDate, and endDate are required');
    }

    return this.analyticsService.generateReport(
      companyId,
      userId,
      dto.type,
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.format || 'PDF'
    );
  }

  /**
   * Get reports
   * GET /api/analytics/reports
   */
  @Get('reports')
  async getReports(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: any
  ) {
    const companyId = req.user.companyId;
    return this.analyticsService.getReports(
      companyId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0
    );
  }

  /**
   * Get single report
   * GET /api/analytics/reports/:id
   */
  @Get('reports/:id')
  async getReport(@Param('id') reportId: string, @Req() req: any) {
    // TODO: Fetch from database
    return { id: reportId };
  }

  /**
   * Get audit logs
   * GET /api/analytics/audit-logs
   */
  @Get('audit-logs')
  async getAuditLogs(@Query('days') days?: string, @Req() req?: any) {
    const companyId = req.user.companyId;
    return this.analyticsService.getAuditLogs(
      companyId,
      days ? parseInt(days, 10) : 30
    );
  }

  /**
   * Export data
   * POST /api/analytics/export
   */
  @Post('export')
  @HttpCode(HttpStatus.CREATED)
  async exportData(@Body() dto: any, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.sub;

    return {
      jobId: 'job-' + Date.now(),
      status: 'QUEUED',
      format: dto.format || 'CSV',
      createdAt: new Date(),
    };
  }

  /**
   * Get export job status
   * GET /api/analytics/export/:jobId
   */
  @Get('export/:jobId')
  async getExportStatus(@Param('jobId') jobId: string, @Req() req: any) {
    const companyId = req.user.companyId;

    return {
      jobId,
      status: 'COMPLETED',
      progress: 100,
      fileUrl: `/api/analytics/export/${jobId}/download`,
    };
  }

  /**
   * Download export file
   * GET /api/analytics/export/:jobId/download
   */
  @Get('export/:jobId/download')
  async downloadExport(@Param('jobId') jobId: string, @Req() req: any) {
    // Return file stream
    return { jobId, message: 'File ready for download' };
  }
}
