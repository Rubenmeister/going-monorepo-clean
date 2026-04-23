import { Injectable, Logger } from '@nestjs/common';
import { CompanySettingsRepository } from '../infrastructure/persistence/company-settings.repository';
import { ApprovalWorkflowRepository } from '../infrastructure/persistence/approval-workflow.repository';

@Injectable()
export class CorporateService {
  private readonly logger = new Logger(CorporateService.name);

  private readonly bookingUrl: string;
  private readonly billingUrl: string;
  private readonly analyticsUrl: string;
  private readonly authUrl: string;

  constructor(
    private readonly settingsRepo: CompanySettingsRepository,
    private readonly approvalRepo: ApprovalWorkflowRepository,
  ) {
    this.bookingUrl  = process.env.BOOKING_SERVICE_URL  || 'http://localhost:3005';
    this.billingUrl  = process.env.BILLING_SERVICE_URL  || 'http://localhost:3008';
    this.analyticsUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009';
    this.authUrl     = process.env.AUTH_SERVICE_URL     || 'http://localhost:3001';
  }

  // ── Stats ──────────────────────────────────────────────────────────────

  async getStats(companyId: string) {
    const [pendingCount, bookingsData] = await Promise.allSettled([
      this.approvalRepo.countPending(companyId),
      this.fetchJson(`${this.bookingUrl}/bookings?companyId=${companyId}&limit=100`, ''),
    ]);

    const bookings: any[] = this.settled(bookingsData, []);
    const allBookings = Array.isArray(bookings) ? bookings : (bookings as any)?.bookings ?? [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySpend = allBookings
      .filter((b: any) => b.status === 'completed' && new Date(b.createdAt) >= startOfMonth)
      .reduce((sum: number, b: any) => sum + (b.totalPrice ?? b.amount ?? 0), 0);

    const activeTrips = allBookings.filter(
      (b: any) => b.status === 'in_progress' || b.status === 'confirmed',
    ).length;

    // Team members from settings
    const settings = await this.settingsRepo.findByCompanyId(companyId).catch(() => null);

    return {
      pendingBookings: this.settled(pendingCount, 0),
      teamMembers: (settings as any)?.teamMemberCount ?? 0,
      monthlySpend: parseFloat(monthlySpend.toFixed(2)),
      activeTrips,
      companyName: (settings as any)?.companyName ?? '',
    };
  }

  // ── Bookings ───────────────────────────────────────────────────────────

  async listBookings(
    companyId: string,
    token: string,
    opts: { page: number; limit: number; status?: string },
  ) {
    const qs = new URLSearchParams({
      companyId,
      page: String(opts.page),
      limit: String(opts.limit),
      ...(opts.status ? { status: opts.status } : {}),
    });
    const data = await this.fetchJson(`${this.bookingUrl}/bookings?${qs}`, token).catch(() => []);
    return Array.isArray(data) ? data : (data as any)?.bookings ?? data;
  }

  async createBooking(companyId: string, token: string, body: any) {
    const payload = { ...body, companyId };
    const settings = await this.settingsRepo.findByCompanyId(companyId).catch(() => null);
    const needsApproval =
      (settings as any)?.requireApproval &&
      (payload.amount ?? payload.totalPrice ?? 0) >= ((settings as any)?.approvalThreshold ?? 0);

    const booking = await this.postJson(`${this.bookingUrl}/bookings`, token, payload);

    if (needsApproval && (booking as any)?.id) {
      await this.approvalRepo.create({
        companyId,
        bookingId: (booking as any).id,
        requesterId: (booking as any).userId ?? '',
        requesterName: body.employeeName ?? '',
        serviceType: body.serviceType ?? body.type ?? '',
        amount: payload.amount ?? payload.totalPrice ?? 0,
        description: `${body.serviceType ?? 'Booking'} — ${body.destination ?? ''}`,
        status: 'pending',
        bookingDetails: booking as any,
      } as any);
    }

    return booking;
  }

  // ── Invoices ───────────────────────────────────────────────────────────

  async listInvoices(companyId: string, token: string) {
    const data = await this.fetchJson(
      `${this.billingUrl}/invoices?companyId=${companyId}`,
      token,
    ).catch(() => []);
    return Array.isArray(data) ? data : (data as any)?.invoices ?? data;
  }

  // ── Approvals ──────────────────────────────────────────────────────────

  async getPendingApprovals(companyId: string) {
    return this.approvalRepo.findPendingByCompany(companyId);
  }

  async decideApproval(
    id: string,
    decision: 'approved' | 'rejected',
    decidedBy: string,
    comments: string,
  ) {
    const result = await this.approvalRepo.decide(id, decision, decidedBy, comments);
    if (!result) throw new Error(`Approval workflow ${id} not found`);

    // Notify booking-service about the decision (non-blocking)
    if ((result as any).bookingId) {
      const newStatus = decision === 'approved' ? 'confirmed' : 'cancelled';
      this.postJson(
        `${this.bookingUrl}/bookings/${(result as any).bookingId}/status`,
        '',
        { status: newStatus, reason: comments },
      ).catch((e) => this.logger.warn(`Could not update booking status: ${e.message}`));
    }

    return result;
  }

  // ── Reports ────────────────────────────────────────────────────────────

  async getReportsSummary(companyId: string, token: string) {
    const [analyticsData, bookingsData] = await Promise.allSettled([
      this.fetchJson(`${this.analyticsUrl}/analytics/corporate?companyId=${companyId}`, token),
      this.fetchJson(`${this.bookingUrl}/bookings?companyId=${companyId}&limit=500`, token),
    ]);

    const analytics = this.settled(analyticsData, {});
    const bookings: any[] = Array.isArray(this.settled(bookingsData, []))
      ? this.settled(bookingsData, [])
      : (this.settled(bookingsData, {}) as any)?.bookings ?? [];

    // Calculate from bookings if analytics endpoint not available
    const byService: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    let totalSpend = 0;
    let completedCount = 0;

    for (const b of bookings) {
      const svc = b.serviceType ?? b.type ?? 'other';
      byService[svc] = (byService[svc] ?? 0) + 1;

      if (b.status === 'completed') {
        completedCount++;
        const amount = b.totalPrice ?? b.amount ?? 0;
        totalSpend += amount;
        const month = new Date(b.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
        byMonth[month] = (byMonth[month] ?? 0) + amount;
      }
    }

    return {
      totalSpend: parseFloat(totalSpend.toFixed(2)),
      totalBookings: bookings.length,
      completedBookings: completedCount,
      byServiceType: byService,
      spendByMonth: byMonth,
      analytics,
    };
  }

  // ── Settings ───────────────────────────────────────────────────────────

  async getSettings(companyId: string) {
    const settings = await this.settingsRepo.findByCompanyId(companyId).catch(() => null);
    return settings ?? { companyId, companyName: '', requireApproval: true, approvalThreshold: 100 };
  }

  async updateSettings(companyId: string, data: any) {
    return this.settingsRepo.upsert(companyId, { ...data, companyId });
  }

  // ── Employees ──────────────────────────────────────────────────────────

  async listEmployees(companyId: string, token: string) {
    const data = await this.fetchJson(
      `${this.authUrl}/users?companyId=${companyId}&role=corporate`,
      token,
    ).catch(() => []);
    return Array.isArray(data) ? data : (data as any)?.users ?? [];
  }

  // ── HTTP helpers ───────────────────────────────────────────────────────

  private async fetchJson(url: string, token: string): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`${res.status} from ${url}`);
    return res.json();
  }

  private async postJson(url: string, token: string, body: unknown): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${res.status} from ${url}`);
    return res.json();
  }

  private settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === 'fulfilled' ? result.value : fallback;
  }
}
