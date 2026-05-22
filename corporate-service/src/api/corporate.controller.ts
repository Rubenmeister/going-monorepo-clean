import {
  Controller, Get, Post, Put, Patch, Body, Param, Query,
  Req, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { CorporateService } from './corporate.service';

@Controller('corporate')
export class CorporateController {
  private readonly logger = new Logger(CorporateController.name);

  constructor(private readonly svc: CorporateService) {}

  /** GET /corporate/stats — Dashboard summary */
  @Get('stats')
  async getStats(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    return this.svc.getStats(companyId);
  }

  /** GET /corporate/bookings?page=1&limit=20&status=pending */
  @Get('bookings')
  async listBookings(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.listBookings(companyId, token, { page: +page, limit: +limit, status });
  }

  /** POST /corporate/bookings — Create a new corporate booking */
  @Post('bookings')
  async createBooking(@Req() req: Request, @Body() body: any) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    const userId = this.extractUserId(req);
    return this.svc.createBooking(companyId, token, userId, body);
  }

  /** GET /corporate/spending-limits — límites configurados de la empresa */
  @Get('spending-limits')
  async listSpendingLimits(@Req() req: Request) {
    return this.svc.listSpendingLimits(this.extractCompanyId(req));
  }

  /** POST /corporate/spending-limits — fija un límite (employee/department/company) */
  @Post('spending-limits')
  async setSpendingLimit(@Req() req: Request, @Body() body: any) {
    return this.svc.setSpendingLimit(this.extractCompanyId(req), body);
  }

  /** GET /corporate/spending-report?month=YYYY-MM — gasto por empleado + límites */
  @Get('spending-report')
  async spendingReport(@Req() req: Request, @Query('month') month?: string) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.getSpendingReport(companyId, token, month);
  }

  /** GET /corporate/invoices */
  @Get('invoices')
  async listInvoices(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.listInvoices(companyId, token);
  }

  /** GET /corporate/approvals/pending */
  @Get('approvals/pending')
  async getPendingApprovals(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    return this.svc.getPendingApprovals(companyId);
  }

  /** PATCH /corporate/approvals/:id/decide */
  @Patch('approvals/:id/decide')
  async decideApproval(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected'; comments?: string },
    @Req() req: Request,
  ) {
    if (!body.decision || !['approved', 'rejected'].includes(body.decision)) {
      throw new BadRequestException('decision must be "approved" or "rejected"');
    }
    const decidedBy = this.extractUserId(req);
    return this.svc.decideApproval(id, body.decision, decidedBy, body.comments ?? '');
  }

  /** GET /corporate/reports/summary */
  @Get('reports/summary')
  async getReportsSummary(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.getReportsSummary(companyId, token);
  }

  /** GET /corporate/settings */
  @Get('settings')
  async getSettings(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    return this.svc.getSettings(companyId);
  }

  /** PUT /corporate/settings */
  @Put('settings')
  async updateSettings(@Req() req: Request, @Body() body: any) {
    const companyId = this.extractCompanyId(req);
    return this.svc.updateSettings(companyId, body);
  }

  /** GET /corporate/employees */
  @Get('employees')
  async listEmployees(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.listEmployees(companyId, token);
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private extractToken(req: Request): string {
    const auth = (req.headers as any)['authorization'] ?? '';
    return auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  }

  private extractCompanyId(req: Request): string {
    // Try JWT claim first (set by api-gateway after token verification)
    const fromHeader = (req.headers as any)['x-company-id'];
    if (fromHeader) return fromHeader;
    // Decode JWT payload without verifying (gateway already verified)
    const token = this.extractToken(req);
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.companyId) return payload.companyId;
      } catch { /* ignore */ }
    }
    return 'default';
  }

  private extractUserId(req: Request): string {
    const token = this.extractToken(req);
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return payload.sub ?? payload.id ?? 'unknown';
      } catch { /* ignore */ }
    }
    return 'unknown';
  }
}
