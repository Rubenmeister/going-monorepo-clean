import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CompanySettingsRepository } from '../infrastructure/persistence/company-settings.repository';
import { ApprovalWorkflowRepository } from '../infrastructure/persistence/approval-workflow.repository';
import { SpendingLimitRepository } from '../infrastructure/persistence/spending-limit.repository';
import { CorporateInvoiceRepository } from '../infrastructure/persistence/corporate-invoice.repository';
import {
  computePeriodSpend,
  checkBudget,
  type BudgetCheck,
  type LimitAmounts,
} from './budget.logic';
import {
  buildApprovalChain,
  applyDecision,
  type ApprovalLevelConfig,
} from './approval.logic';

function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

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
    private readonly limitRepo: SpendingLimitRepository,
    private readonly invoiceRepo: CorporateInvoiceRepository,
  ) {
    this.bookingUrl  = process.env.BOOKING_SERVICE_URL  || 'http://localhost:3005';
    this.billingUrl  = process.env.BILLING_SERVICE_URL  || 'http://localhost:3008';
    this.analyticsUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009';
    this.authUrl     = process.env.AUTH_SERVICE_URL     || 'http://localhost:3001';
  }

  // ── Stats ──────────────────────────────────────────────────────────────

  async getStats(companyId: string, token: string) {
    const [pendingCount, bookingsData] = await Promise.allSettled([
      this.approvalRepo.countPending(companyId),
      this.fetchJson(`${this.bookingUrl}/bookings?companyId=${companyId}&limit=100`, token),
    ]);

    const bookings: any = this.settled(bookingsData, []);
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

  async createBooking(companyId: string, token: string, userId: string, body: any) {
    const amount = body.amount ?? body.totalPrice ?? 0;

    // Enforcement de presupuesto del empleado ANTES de crear el booking.
    const budget = await this.checkEmployeeBudget(
      companyId,
      token,
      userId,
      amount,
      body.department,
    );
    if (!budget.allowed) {
      throw new ForbiddenException(
        `Límite de presupuesto ${budget.breachedPeriod} excedido: tope $${budget.limit}, ` +
          `el viaje llevaría el gasto a $${budget.wouldSpend}.`,
      );
    }

    const payload = {
      ...body,
      companyId,
      clientSegment: 'corporate', // +25% premium (sin descuentos)
      paymentMode: body.paymentMode ?? 'corporate_monthly', // cobro diferido a fin de mes
    };
    const settings = await this.settingsRepo.findByCompanyId(companyId).catch(() => null);
    const needsApproval =
      (settings as any)?.requireApproval &&
      (payload.amount ?? payload.totalPrice ?? 0) >= ((settings as any)?.approvalThreshold ?? 0);

    const booking = await this.postJson(`${this.bookingUrl}/bookings`, token, payload);

    if (needsApproval && (booking as any)?.id) {
      const chainAmount = payload.amount ?? payload.totalPrice ?? 0;
      const levels = ((settings as any)?.approvalLevels ?? []) as ApprovalLevelConfig[];
      const chain = buildApprovalChain(chainAmount, levels);
      await this.approvalRepo.create({
        companyId,
        bookingId: (booking as any).id,
        requesterId: (booking as any).userId ?? '',
        requesterName: body.employeeName ?? '',
        serviceType: body.serviceType ?? body.type ?? '',
        amount: chainAmount,
        description: `${body.serviceType ?? 'Booking'} — ${body.destination ?? ''}`,
        status: 'pending',
        approvalChain: chain as any,
        currentLevel: chain[0]?.level ?? 1,
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
    const wf = await this.approvalRepo.findById(id);
    if (!wf) throw new Error(`Approval workflow ${id} not found`);

    // Documentos previos a la cadena multinivel: sintetiza un único nivel.
    const existingChain = ((wf as any).approvalChain ?? []) as any[];
    const chain =
      existingChain.length > 0
        ? existingChain
        : buildApprovalChain((wf as any).amount ?? 0, []);
    const currentLevel = (wf as any).currentLevel ?? chain[0]?.level ?? 1;

    const r = applyDecision(chain as any, currentLevel, decision, decidedBy, comments ?? '');
    if (!r.changed) {
      throw new BadRequestException(
        `No hay un paso pendiente en el nivel ${currentLevel} de este flujo`,
      );
    }

    const result = await this.approvalRepo.update(id, {
      approvalChain: r.chain as any,
      currentLevel: r.currentLevel,
      status: r.status,
      decidedBy,
      decidedAt: new Date(),
      comments: comments ?? '',
    } as any);

    // Sólo al cerrar la cadena se confirma/cancela el booking (no en pasos intermedios).
    if (r.finalized && (wf as any).bookingId) {
      const newStatus = r.status === 'approved' ? 'confirmed' : 'cancelled';
      this.postJson(
        `${this.bookingUrl}/bookings/${(wf as any).bookingId}/status`,
        '',
        { status: newStatus, reason: comments },
      ).catch((e) => this.logger.warn(`Could not update booking status: ${e.message}`));
    }

    return { ...(result as any), finalized: r.finalized };
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

  // ── Spending limits (presupuesto por empleado/departamento/empresa) ──────

  async listSpendingLimits(companyId: string) {
    return this.limitRepo.findByCompany(companyId);
  }

  async setSpendingLimit(companyId: string, body: any) {
    const scope = body?.scope;
    if (!['employee', 'department', 'company'].includes(scope)) {
      throw new BadRequestException(
        "scope debe ser 'employee' | 'department' | 'company'",
      );
    }
    const targetId = scope === 'company' ? '' : String(body.targetId ?? '');
    if (scope !== 'company' && !targetId) {
      throw new BadRequestException(
        'targetId requerido para scope employee/department',
      );
    }
    return this.limitRepo.upsert(companyId, scope, targetId, {
      daily: numOrNull(body.daily),
      weekly: numOrNull(body.weekly),
      monthly: numOrNull(body.monthly),
    });
  }

  /** ¿El empleado puede gastar `amount` sin exceder su presupuesto? */
  async checkEmployeeBudget(
    companyId: string,
    token: string,
    employeeId: string,
    amount: number,
    department?: string,
  ): Promise<BudgetCheck> {
    const limit = await this.limitRepo.resolveForEmployee(
      companyId,
      employeeId,
      department,
    );
    if (!limit) {
      return {
        allowed: true,
        remaining: { daily: null, weekly: null, monthly: null },
      };
    }
    const bookings = await this.companyBookings(companyId, token);
    const spend = computePeriodSpend(bookings, employeeId);
    return checkBudget(limit, spend, amount);
  }

  async getSpendingReport(companyId: string, token: string, month?: string) {
    const bookings = await this.companyBookings(companyId, token);
    const inScope = (b: any): boolean => {
      if (!['completed', 'confirmed', 'in_progress', 'pending'].includes(b.status)) {
        return false;
      }
      if (!month) return true;
      const ym = b.createdAt ? new Date(b.createdAt).toISOString().slice(0, 7) : '';
      return ym === month;
    };

    const byEmployee: Record<string, number> = {};
    let total = 0;
    for (const b of bookings) {
      if (!inScope(b)) continue;
      const amt = b.totalPrice ?? b.amount ?? 0;
      const emp = b.userId ?? 'unknown';
      byEmployee[emp] = parseFloat(((byEmployee[emp] ?? 0) + amt).toFixed(2));
      total += amt;
    }
    const limits = await this.limitRepo.findByCompany(companyId);
    return {
      month: month ?? 'all',
      total: parseFloat(total.toFixed(2)),
      byEmployee,
      limits,
    };
  }

  /**
   * Estado de cuenta mensual consolidado (preview no persistido). Reusa el mismo
   * cómputo que la factura: GET muestra, generateMonthlyInvoice materializa.
   */
  async getMonthlyStatement(companyId: string, token: string, month?: string) {
    return this.computeStatement(companyId, token, month);
  }

  /** Cómputo puro del estado de cuenta de un mes (sin persistir). */
  private async computeStatement(companyId: string, token: string, month?: string) {
    const m = month ?? new Date().toISOString().slice(0, 7);
    const bookings = await this.companyBookings(companyId, token);
    const inMonth = bookings.filter(
      (b: any) =>
        b.createdAt &&
        new Date(b.createdAt).toISOString().slice(0, 7) === m &&
        ['completed', 'confirmed'].includes(b.status),
    );

    const byEmployee: Record<string, { count: number; amount: number }> = {};
    const byServiceType: Record<string, number> = {};
    const lineItems: any[] = [];
    let total = 0;

    for (const b of inMonth) {
      const amt = b.totalPrice ?? b.amount ?? 0;
      const emp = b.userId ?? 'unknown';
      const svc = b.serviceType ?? b.type ?? 'other';
      const prev = byEmployee[emp] ?? { count: 0, amount: 0 };
      byEmployee[emp] = {
        count: prev.count + 1,
        amount: parseFloat((prev.amount + amt).toFixed(2)),
      };
      byServiceType[svc] = parseFloat(((byServiceType[svc] ?? 0) + amt).toFixed(2));
      total += amt;
      lineItems.push({
        bookingId: b.id ?? b._id,
        employeeId: emp,
        serviceType: svc,
        amount: amt,
        date: b.createdAt,
      });
    }

    const settings = await this.settingsRepo
      .findByCompanyId(companyId)
      .catch(() => null);
    return {
      companyId,
      month: m,
      currency: (settings as any)?.currency ?? 'USD',
      billingMode: (settings as any)?.billingMode ?? 'monthly_consolidated',
      contractStatus: (settings as any)?.contractStatus ?? 'active',
      tripCount: inMonth.length,
      total: parseFloat(total.toFixed(2)),
      byEmployee,
      byServiceType,
      lineItems,
    };
  }

  /**
   * Materializa (o regenera) la factura consolidada del mes y la persiste.
   * Idempotente: re-ejecutarla recalcula el mismo (companyId, month).
   */
  async generateMonthlyInvoice(companyId: string, token: string, month?: string) {
    const s = await this.computeStatement(companyId, token, month);
    const dueDate = this.invoiceDueDate(s.month);
    return this.invoiceRepo.upsertForMonth(companyId, s.month, {
      invoiceNumber: this.invoiceNumber(companyId, s.month),
      currency: s.currency,
      status: 'issued',
      billingMode: s.billingMode,
      contractStatus: s.contractStatus,
      tripCount: s.tripCount,
      total: s.total,
      byEmployee: s.byEmployee,
      byServiceType: s.byServiceType,
      lineItems: s.lineItems,
      issuedAt: new Date(),
      dueDate,
    } as any);
  }

  async listCorporateInvoices(companyId: string) {
    return this.invoiceRepo.findByCompany(companyId);
  }

  async getCorporateInvoice(id: string) {
    return this.invoiceRepo.findById(id);
  }

  async markInvoicePaid(id: string) {
    return this.invoiceRepo.updateStatus(id, 'paid', new Date());
  }

  /** Número de factura determinista por (empresa, mes): INV-YYYYMM-XXXXXXXX. */
  private invoiceNumber(companyId: string, month: string): string {
    const ym = month.replace('-', '');
    const co = companyId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'CORP';
    return `INV-${ym}-${co}`;
  }

  /** Vencimiento: día 15 del mes siguiente al período facturado. */
  private invoiceDueDate(month: string): Date {
    const [y, mo] = month.split('-').map((n) => parseInt(n, 10));
    // mo es 1-based; el mes siguiente en índice 0-based es justamente `mo`.
    return new Date(y, mo, 15);
  }

  private async companyBookings(companyId: string, token: string): Promise<any[]> {
    const data = await this.fetchJson(
      `${this.bookingUrl}/bookings?companyId=${companyId}&limit=500`,
      token,
    ).catch(() => []);
    return Array.isArray(data) ? data : (data as any)?.bookings ?? [];
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
