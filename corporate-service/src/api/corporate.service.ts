import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { CompanySettingsRepository } from '../infrastructure/persistence/company-settings.repository';
import { ApprovalWorkflowRepository } from '../infrastructure/persistence/approval-workflow.repository';
import { SpendingLimitRepository } from '../infrastructure/persistence/spending-limit.repository';
import { CorporateInvoiceRepository } from '../infrastructure/persistence/corporate-invoice.repository';
import { TeamInvitationRepository } from '../infrastructure/persistence/team-invitation.repository';
import { QuoteRepository } from '../infrastructure/persistence/quote.repository';
import { DashcamClipRequestRepository } from '../infrastructure/persistence/dashcam-clip-request.repository';
import { randomUUID } from 'node:crypto';
import { CompanyApplicationRepository } from '../infrastructure/persistence/company-application.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CorporateFavoriteSchema } from '../infrastructure/schemas/corporate-favorite.schema';
import { isValidEcuadorianRuc } from './ruc.validator';
import {
  computePeriodSpend,
  checkBudget,
  type BudgetCheck,
  type LimitAmounts,
} from './budget.logic';
import {
  buildApprovalChain,
  applyDecision,
  evaluateTravelPolicy,
  type ApprovalLevelConfig,
  type TravelPolicy,
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
  private readonly notificationsUrl: string;

  constructor(
    private readonly settingsRepo: CompanySettingsRepository,
    private readonly approvalRepo: ApprovalWorkflowRepository,
    private readonly limitRepo: SpendingLimitRepository,
    private readonly invoiceRepo: CorporateInvoiceRepository,
    private readonly invitationRepo: TeamInvitationRepository,
    private readonly quoteRepo: QuoteRepository,
    private readonly clipRequestRepo: DashcamClipRequestRepository,
    private readonly applicationRepo: CompanyApplicationRepository,
    @InjectModel(CorporateFavoriteSchema.name)
    private readonly favModel: Model<CorporateFavoriteSchema>,
  ) {
    this.bookingUrl  = process.env.BOOKING_SERVICE_URL  || 'http://localhost:3005';
    this.billingUrl  = process.env.BILLING_SERVICE_URL  || 'http://localhost:3008';
    this.analyticsUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009';
    // OJO: en Cloud Run la env se llama USER_AUTH_SERVICE_URL. Leer solo
    // AUTH_SERVICE_URL hacía caer al fallback localhost:3001 → "fetch failed"
    // al aprobar una empresa, y el approve NO provisionaba la cuenta (quedaba
    // provisioned:false en silencio, con la solicitud igual marcada aprobada).
    this.authUrl     = process.env.AUTH_SERVICE_URL
                    || process.env.USER_AUTH_SERVICE_URL
                    || 'http://localhost:3001';
    this.notificationsUrl = process.env.NOTIFICATIONS_SERVICE_URL || process.env.NOTIFICATION_SERVICE_URL || '';
  }

  // ── Favoritos corporativos (rutas/lugares guardados por usuario) ─────────

  async listFavorites(companyId: string, userId: string): Promise<any[]> {
    const docs = await this.favModel
      .find({ companyId, userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    // Aplanamos: { id, name, ...payload } para que el front reciba el favorito
    // completo tal como lo guardó.
    return docs.map((d: any) => ({
      id: String(d._id),
      name: d.name,
      ...(d.payload ?? {}),
    }));
  }

  async addFavorite(
    companyId: string,
    userId: string,
    body: Record<string, any>,
  ): Promise<any> {
    const name = (body?.name ?? '').trim();
    if (!name) throw new BadRequestException('name es requerido');
    // Guardamos el resto de campos en payload (sin id/name/_id).
    const { name: _n, id: _i, _id: _mid, ...payload } = body ?? {};
    const doc = await this.favModel.create({ companyId, userId, name, payload });
    return { id: String(doc._id), name: doc.name, ...(doc.payload as any) };
  }

  async removeFavorite(companyId: string, userId: string, id: string): Promise<{ ok: boolean }> {
    // Scoped: solo borra si el favorito es de ESTE usuario+empresa.
    const res = await this.favModel.deleteOne({ _id: id, companyId, userId }).exec();
    return { ok: res.deletedCount > 0 };
  }

  // ── Solicitudes de alta (embudo B2B — antes se perdían in-memory) ────────

  /**
   * Crea una solicitud de alta de empresa (prospecto). PÚBLICO (sin auth): lo
   * llama el formulario del sitio. Valida RUC (formato+checksum), deduplica
   * solicitudes abiertas por RUC/email, persiste y avisa a ventas (best-effort).
   */
  async createApplication(input: {
    razonSocial: string;
    ruc: string;
    tipoCuenta?: string;
    contactoNombre: string;
    contactoEmail: string;
    contactoTelefono?: string;
    ciudad?: string;
    empleadosEstimados?: number;
    notas?: string;
    metadata?: Record<string, unknown>;
  }) {
    const email = input.contactoEmail.trim().toLowerCase();
    const ruc = input.ruc.trim();
    const rucValido = isValidEcuadorianRuc(ruc);

    const existing = await this.applicationRepo.findOpenByRucOrEmail(ruc, email);
    if (existing) {
      // Idempotente para el prospecto: no crea duplicados ni le muestra error.
      return { id: (existing as any)._id?.toString?.() ?? '', estado: existing.estado, rucValido: existing.rucValido, duplicate: true };
    }

    const doc = await this.applicationRepo.create({
      razonSocial: input.razonSocial.trim(),
      ruc,
      tipoCuenta: input.tipoCuenta || 'negocio',
      contactoNombre: input.contactoNombre.trim(),
      contactoEmail: email,
      contactoTelefono: (input.contactoTelefono || '').trim(),
      ciudad: (input.ciudad || '').trim(),
      empleadosEstimados: Number(input.empleadosEstimados) || undefined,
      notas: (input.notas || '').trim(),
      estado: 'prospect',
      rucValido,
      metadata: input.metadata || {},
    });
    const id = (doc as any)._id?.toString?.() ?? '';

    // Aviso a ventas (best-effort — nunca rompe el alta del prospecto).
    void this.notifySales(
      `🏢 Nueva solicitud de empresa: *${input.razonSocial}* (RUC ${ruc}${rucValido ? '' : ' ⚠️ inválido'}). ` +
      `Contacto: ${input.contactoNombre} · ${email}${input.contactoTelefono ? ' · ' + input.contactoTelefono : ''}.`,
    ).catch(() => undefined);

    this.logger.log(`Nueva solicitud de empresa: ${input.razonSocial} (RUC ${ruc}, válido=${rucValido})`);
    return { id, estado: 'prospect', rucValido, duplicate: false };
  }

  async listApplications(estado?: string, limit = 200) {
    const apps = await this.applicationRepo.findAll(estado, limit);
    return { applications: apps, total: apps.length };
  }

  /** Cambia el estado de una solicitud (contacted/approved/rejected). Admin. */
  async decideApplication(id: string, estado: string, decidedBy: string, companyId?: string) {
    if (!['contacted', 'approved', 'rejected'].includes(estado)) {
      throw new BadRequestException('estado debe ser contacted|approved|rejected');
    }
    const app = await this.applicationRepo.findById(id);
    if (!app) throw new NotFoundException('solicitud no encontrada');
    const updated = await this.applicationRepo.updateStatus(id, { estado, decididoPor: decidedBy, companyId });
    return { ok: true, application: updated };
  }

  /** Envío best-effort de una alerta a ventas vía notifications-service. */
  private async notifySales(message: string): Promise<void> {
    if (!this.notificationsUrl) {
      this.logger.warn(`NOTIFICATIONS_SERVICE_URL no configurada — aviso a ventas solo en log: ${message}`);
      return;
    }
    try {
      await fetch(`${this.notificationsUrl}/notifications/internal/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'sales', message }),
      });
    } catch (e) {
      this.logger.warn(`notifySales falló (best-effort): ${(e as Error).message}`);
    }
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

    const settings = await this.settingsRepo.findByCompanyId(companyId).catch(() => null);

    // ── Política de viajes (Gap #2) ─────────────────────────────────────
    // Valida tope, servicios permitidos, justificación, horarios, días.
    // Si policy.enabled=false → no aplica.
    const policy = (settings as any)?.travelPolicy as TravelPolicy | undefined;
    const policyResult = evaluateTravelPolicy(policy, {
      amount,
      serviceType: body.serviceType ?? body.type ?? 'transport',
      startDate: body.startDate,
      justification: body.justification,
      isPersonal: !!body.isPersonal,
      isInternational: !!body.isInternational,
    });
    if (!policyResult.allowed) {
      throw new ForbiddenException(
        `La reserva viola la política corporativa: ${policyResult.messages.join(' ')}`,
      );
    }

    const payload = {
      ...body,
      companyId,
      clientSegment: 'corporate', // +25% premium (sin descuentos)
      paymentMode: body.paymentMode ?? 'corporate_monthly', // cobro diferido a fin de mes
    };

    // needsApproval ahora combina la lógica legacy (requireApproval + threshold)
    // con la nueva política (requiresApproval por horario, día o monto).
    const legacyNeedsApproval =
      (settings as any)?.requireApproval &&
      (payload.amount ?? payload.totalPrice ?? 0) >= ((settings as any)?.approvalThreshold ?? 0);
    // El solicitante puede FORZAR aprobación desde la UI ("Enviar para aprobación"),
    // aunque no supere umbral ni política. Así el toggle del panel es real.
    const clientForcedApproval = !!body.requiresApproval;
    const needsApproval =
      legacyNeedsApproval || policyResult.requiresApproval || clientForcedApproval;

    const booking = await this.postJson(`${this.bookingUrl}/bookings`, token, payload);

    if (needsApproval && (booking as any)?.id) {
      const chainAmount = payload.amount ?? payload.totalPrice ?? 0;
      const levels = ((settings as any)?.approvalLevels ?? []) as ApprovalLevelConfig[];
      const chain = buildApprovalChain(chainAmount, levels);
      const policyNote = policyResult.requiresApproval
        ? ` [política: ${policyResult.violations.join(', ')}]`
        : '';
      await this.approvalRepo.create({
        companyId,
        bookingId: (booking as any).id,
        requesterId: (booking as any).userId ?? '',
        requesterName: body.employeeName ?? '',
        serviceType: body.serviceType ?? body.type ?? '',
        amount: chainAmount,
        description: `${body.serviceType ?? 'Booking'} — ${body.destination ?? ''}${policyNote}`,
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
    companyId: string,
    id: string,
    decision: 'approved' | 'rejected',
    decidedBy: string,
    comments: string,
  ) {
    const wf = await this.approvalRepo.findById(companyId, id);
    if (!wf) throw new NotFoundException(`Approval workflow ${id} no encontrado`);

    // Documentos previos a la cadena multinivel: sintetiza un único nivel.
    const existingChain = ((wf as any).approvalChain ?? []) as any[];
    const chain =
      existingChain.length > 0
        ? existingChain
        : buildApprovalChain((wf as any).amount ?? 0, []);
    const currentLevel = (wf as any).currentLevel ?? chain[0]?.level ?? 1;

    // Bloque 3: autorización del decisor. Nunca el solicitante (auto-aprobación) y,
    // si el nivel tiene aprobador asignado, solo ese usuario puede decidir.
    if ((wf as any).requesterId && (wf as any).requesterId === decidedBy) {
      throw new ForbiddenException('No puedes aprobar tu propia solicitud');
    }
    const step = (chain as any[]).find(
      (s) => s.level === currentLevel && s.status === 'pending',
    );
    if (step && step.approverId && step.approverId !== decidedBy) {
      throw new ForbiddenException('No eres el aprobador asignado para este nivel');
    }

    const r = applyDecision(chain as any, currentLevel, decision, decidedBy, comments ?? '');
    if (!r.changed) {
      throw new BadRequestException(
        `No hay un paso pendiente en el nivel ${currentLevel} de este flujo`,
      );
    }

    const result = await this.approvalRepo.update(companyId, id, {
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
    // adminUserIds solo se gestiona por los endpoints dedicados, nunca por settings.
    const { adminUserIds, ...safe } = data ?? {};
    return this.settingsRepo.upsert(companyId, { ...safe, companyId });
  }

  // ── Bloque 3 (#5): admins de empresa (Opción B, rollout monitoreado) ────────
  /**
   * Exige que quien actúa sea admin de la empresa (o staff Going). Rollout
   * monitoreado: en log-only (default) solo LOGUEA lo que bloquearía; con
   * COMPANY_ADMIN_ENFORCED=1 bloquea de verdad. Empresa sin adminUserIds
   * (no migrada) → fallback: solo staff Going pasa (y en log-only se permite).
   */
  async assertCompanyAdmin(
    companyId: string,
    userId: string,
    isPlatformAdmin: boolean,
    action: string,
  ): Promise<void> {
    if (isPlatformAdmin) return; // staff Going siempre puede
    const settings: any = await this.settingsRepo.findByCompanyId(companyId).catch(() => null);
    const admins: string[] = settings?.adminUserIds ?? [];
    if (admins.includes(userId)) return;

    // Auto-bootstrap: la empresa sin admins → el primer usuario que configura queda
    // como admin (evita fricción de onboarding; suele ser quien monta la cuenta).
    if (admins.length === 0 && userId) {
      await this.settingsRepo.upsert(companyId, { companyId, adminUserIds: [userId] } as any);
      this.logger.log(`[company-admin] auto-bootstrap: ${userId} es el 1er admin de ${companyId}`);
      return;
    }

    const enforced = process.env.COMPANY_ADMIN_ENFORCED === '1';
    const reason = admins.length === 0 ? 'empresa sin admins (no migrada)' : 'no es admin de empresa';
    if (enforced) {
      throw new ForbiddenException('Se requiere ser administrador de la empresa');
    }
    this.logger.warn(
      `[company-admin] ${action}: user ${userId} @ ${companyId} BLOQUEARÍA (${reason}) — log-only`,
    );
  }

  /** Lista los admins de la empresa. */
  async listCompanyAdmins(companyId: string): Promise<string[]> {
    const settings: any = await this.settingsRepo.findByCompanyId(companyId).catch(() => null);
    return settings?.adminUserIds ?? [];
  }

  /**
   * Agrega un admin. Bootstrap: si la empresa no tiene admins, cualquier miembro
   * corporativo (o staff Going) puede nombrar al primero. Con admins ya presentes,
   * solo un admin existente o staff Going puede agregar más.
   */
  async addCompanyAdmin(
    companyId: string,
    callerId: string,
    isPlatformAdmin: boolean,
    targetUserId: string,
  ): Promise<string[]> {
    if (!targetUserId) throw new BadRequestException('userId requerido');
    const current: string[] = await this.listCompanyAdmins(companyId);
    if (current.length > 0 && !isPlatformAdmin && !current.includes(callerId)) {
      throw new ForbiddenException('Solo un admin de la empresa puede agregar administradores');
    }
    if (current.includes(targetUserId)) return current;
    const next = [...current, targetUserId];
    await this.settingsRepo.upsert(companyId, { companyId, adminUserIds: next } as any);
    this.logger.log(`[company-admin] ${callerId} agregó admin ${targetUserId} @ ${companyId}`);
    return next;
  }

  /** Quita un admin. Solo admin/staff; nunca deja la empresa sin admins. */
  async removeCompanyAdmin(
    companyId: string,
    callerId: string,
    isPlatformAdmin: boolean,
    targetUserId: string,
  ): Promise<string[]> {
    const current: string[] = await this.listCompanyAdmins(companyId);
    if (!isPlatformAdmin && !current.includes(callerId)) {
      throw new ForbiddenException('Solo un admin de la empresa puede quitar administradores');
    }
    if (!current.includes(targetUserId)) return current;
    const next = current.filter((id) => id !== targetUserId);
    if (next.length === 0) {
      throw new BadRequestException('La empresa debe tener al menos un administrador');
    }
    await this.settingsRepo.upsert(companyId, { companyId, adminUserIds: next } as any);
    this.logger.log(`[company-admin] ${callerId} quitó admin ${targetUserId} @ ${companyId}`);
    return next;
  }

  /**
   * MIGRACIÓN (Bloque 3 #5): siembra el admin inicial de cada empresa que aún no
   * tiene ninguno = el usuario corporativo MÁS ANTIGUO. Idempotente (salta las que
   * ya tienen admins). Usa el token del staff Going que lo dispara para consultar
   * user-auth. Corre en dry-run si dryRun=true (no escribe, solo reporta).
   */
  async migrateCompanyAdmins(
    token: string,
    dryRun = false,
  ): Promise<{ total: number; seeded: number; skipped: number; noUsers: number; dryRun: boolean; details: any[] }> {
    const companies = (await this.settingsRepo.findAll().catch(() => [])) as any[];
    const details: any[] = [];
    let seeded = 0;
    let skipped = 0;
    let noUsers = 0;
    for (const c of companies) {
      const companyId = c.companyId;
      if (Array.isArray(c.adminUserIds) && c.adminUserIds.length > 0) {
        skipped++;
        continue;
      }
      const users: any[] = await this.listEmployees(companyId, token).catch(() => []);
      if (!users.length) {
        noUsers++;
        details.push({ companyId, result: 'sin usuarios corporativos' });
        continue;
      }
      const earliest = [...users].sort(
        (a, b) =>
          new Date(a.createdAt ?? a.created_at ?? 0).getTime() -
          new Date(b.createdAt ?? b.created_at ?? 0).getTime(),
      )[0];
      const adminId = String(earliest.id ?? earliest._id ?? earliest.userId ?? '');
      if (!adminId) {
        noUsers++;
        details.push({ companyId, result: 'usuario sin id' });
        continue;
      }
      if (!dryRun) {
        await this.settingsRepo.upsert(companyId, { companyId, adminUserIds: [adminId] } as any);
        this.logger.log(`[company-admin][migrate] ${companyId} → admin ${adminId}`);
      }
      seeded++;
      details.push({ companyId, admin: adminId, wouldSeed: dryRun });
    }
    return { total: companies.length, seeded, skipped, noUsers, dryRun, details };
  }

  // ── Travel Policy (Gap #2) ─────────────────────────────────────────────

  /**
   * GET /corporate/policy — devuelve la política de viajes vigente.
   * Si nunca se configuró, retorna defaults conservadores (todo permitido).
   */
  async getTravelPolicy(companyId: string) {
    const settings = await this.settingsRepo.findByCompanyId(companyId).catch(() => null);
    const policy = (settings as any)?.travelPolicy;
    if (policy && policy.enabled !== undefined) {
      return policy;
    }
    // Defaults: política desactivada, sin restricciones, todo permitido.
    return {
      enabled: false,
      maxFarePerTrip: 0,
      maxFarePerDay: 0,
      maxFarePerMonth: 0,
      requireJustificationAbove: 0,
      allowedServices: ['transport', 'tours', 'experiences', 'accommodation', 'parcels'],
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
      allowedHoursFrom: '00:00',
      allowedHoursTo: '23:59',
      autoApproveBelow: 0,
      requireApprovalAbove: 0,
      allowPersonalUse: false,
      allowInternational: false,
    };
  }

  /**
   * PUT /corporate/policy — actualiza la política de viajes.
   * Valida coherencia: autoApprove < requireApproval < maxPerTrip.
   * Audita: `policyChangedBy` + `policyChangedAt`.
   */
  async updateTravelPolicy(
    companyId: string,
    changedBy: string,
    policy: Record<string, unknown>,
  ) {
    // Validación de coherencia básica.
    const autoApprove = Number(policy.autoApproveBelow ?? 0);
    const requireApproval = Number(policy.requireApprovalAbove ?? 0);
    const maxPerTrip = Number(policy.maxFarePerTrip ?? 0);

    if (autoApprove < 0 || requireApproval < 0 || maxPerTrip < 0) {
      throw new BadRequestException(
        'Los montos de la política no pueden ser negativos',
      );
    }
    if (maxPerTrip > 0 && requireApproval > 0 && requireApproval >= maxPerTrip) {
      throw new BadRequestException(
        'requireApprovalAbove debe ser menor que maxFarePerTrip',
      );
    }
    if (autoApprove > 0 && requireApproval > 0 && autoApprove >= requireApproval) {
      throw new BadRequestException(
        'autoApproveBelow debe ser menor que requireApprovalAbove',
      );
    }
    if (Array.isArray(policy.allowedHoursFrom) || Array.isArray(policy.allowedHoursTo)) {
      throw new BadRequestException('allowedHoursFrom/To deben ser strings HH:MM');
    }

    return this.settingsRepo.upsert(companyId, {
      companyId,
      travelPolicy: policy as any,
      policyChangedBy: changedBy,
      policyChangedAt: new Date(),
    } as any);
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

  async getCorporateInvoice(companyId: string, id: string) {
    return this.invoiceRepo.findById(companyId, id);
  }

  async markInvoicePaid(companyId: string, id: string) {
    return this.invoiceRepo.updateStatus(companyId, id, 'paid', new Date());
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

  // ── Equipo: invitaciones ───────────────────────────────────────────────

  /**
   * Crea una invitación (persistida en Mongo) y delega el email al
   * notifications-service cuando esté disponible. Sin email, la empresa puede
   * compartir el link manualmente.
   */
  async inviteTeamMember(
    companyId: string,
    invitedBy: string,
    data: { email: string; firstName?: string; lastName?: string; role: string },
  ): Promise<{ invitationId: string; email: string; inviteLink: string }> {
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const invitation = {
      id: invitationId,
      companyId,
      invitedBy,
      email: data.email.toLowerCase().trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      status: 'pending', // pending | accepted | expired
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    await this.invitationRepo.create(invitation);

    const baseUrl = process.env.APP_BASE_URL || 'https://app.goingec.com';
    const inviteLink = `${baseUrl}/empresas/auth/accept-invite?token=${invitationId}`;

    this.logger.log(
      `Invitation ${invitationId} for ${invitation.email} role=${invitation.role} (link: ${inviteLink})`,
    );

    // Email de invitación (best-effort) — nunca rompe la creación de la invitación.
    // Si no hay notifications-service configurado, la empresa comparte el link manual.
    void this.sendInviteEmail(invitation.email, {
      firstName: invitation.firstName || '',
      role: invitation.role,
      inviteLink,
    }).catch(() => undefined);

    return { invitationId, email: invitation.email, inviteLink };
  }

  /** Envía el email de invitación al equipo corporativo (best-effort). */
  private async sendInviteEmail(
    to: string,
    ctx: { firstName: string; role: string; inviteLink: string },
  ): Promise<void> {
    if (!this.notificationsUrl) {
      this.logger.warn(`NOTIFICATIONS_SERVICE_URL no configurada — invitación solo por link manual (${to})`);
      return;
    }
    try {
      await fetch(`${this.notificationsUrl}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'email',
          to,
          template: 'corporate_invite',
          data: { firstName: ctx.firstName, role: ctx.role, inviteLink: ctx.inviteLink },
        }),
      });
    } catch (e) {
      this.logger.warn(`sendInviteEmail falló (best-effort): ${(e as Error).message}`);
    }
  }

  // ── Quotes (cotizaciones) ──────────────────────────────────────────────
  // Persistidas en Mongo (QuoteRepository).

  async listQuotes(companyId: string): Promise<{ quotes: any[] }> {
    const quotes = await this.quoteRepo.findByCompany(companyId);
    return { quotes };
  }

  async createQuote(companyId: string, userId: string, data: any): Promise<any> {
    if (!data?.eventName || !data?.contactName) {
      throw new BadRequestException('eventName and contactName are required');
    }
    const quote = {
      id: `quote_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      companyId,
      requestedBy: userId,
      serviceType: data.serviceType ?? 'transport',
      groupSize: data.groupSize ?? 0,
      eventName: String(data.eventName).trim(),
      eventDate: data.eventDate,
      origin: data.origin?.trim(),
      destination: data.destination?.trim(),
      city: data.city?.trim(),
      estimatedBudget: data.estimatedBudget,
      notes: data.notes,
      contactName: String(data.contactName).trim(),
      contactPhone: data.contactPhone,
      status: 'pending', // pending | quoted | accepted | rejected
      createdAt: new Date().toISOString(),
    };
    await this.quoteRepo.create(quote);
    this.logger.log(`Quote ${quote.id} created for company=${companyId} event="${quote.eventName}"`);
    return quote;
  }

  // ── Mapa: viajes activos para ver empleados en ruta ────────────────────

  async getActiveBookings(companyId: string, token: string): Promise<any[]> {
    const bookings = await this.companyBookings(companyId, token);
    return bookings
      .filter((b) => ['confirmed', 'in_progress', 'pending'].includes(b.status))
      .map((b) => ({
        id: b.id ?? b._id,
        employeeId: b.userId,
        employeeName: b.userName ?? b.employeeName ?? 'Empleado',
        department: b.department ?? b.metadata?.department,
        serviceType: b.serviceType ?? 'transport',
        status: b.status,
        destination: b.metadata?.destination ?? b.destination,
        driverName: b.driverName ?? b.driver?.name,
        vehiclePlate: b.vehiclePlate ?? b.vehicle?.plate,
        startedAt: b.startedAt ?? b.createdAt,
        totalPrice: b.totalPrice ?? b.amount,
        // consentGiven: marca si el empleado dio consent para tracking.
        // Por default true porque solo los empleados con consent ya están
        // en la base — el flag se setea en onboarding del portal corporativo.
        consentGiven: b.consentGiven ?? true,
      }));
  }

  // ── Sostenibilidad (huella de carbono) ─────────────────────────────────

  /**
   * Calcula huella de CO₂ aproximada por servicio:
   * - SUV: 0.22 kg/km
   * - VAN: 0.30 kg/km
   * - BUS/MINIBUS: 0.85 kg/km (pero por pasajero queda más bajo)
   *
   * Asumimos ~10 km promedio si no hay distance en el booking; valor real
   * vendría de tracking-service o del booking ya cerrado con distanceKm.
   */
  async getSustainabilityReport(
    companyId: string,
    token: string,
    period: 'month' | 'quarter' | 'year',
  ) {
    const bookings = await this.companyBookings(companyId, token);
    const completed = bookings.filter((b) => b.status === 'completed');

    const now = new Date();
    const cutoff = new Date(now);
    if (period === 'month')   cutoff.setMonth(cutoff.getMonth() - 1);
    if (period === 'quarter') cutoff.setMonth(cutoff.getMonth() - 3);
    if (period === 'year')    cutoff.setFullYear(cutoff.getFullYear() - 1);

    const inPeriod = completed.filter((b) => new Date(b.completedAt ?? b.createdAt) >= cutoff);
    const co2PerKm = (vt?: string) => {
      const v = (vt ?? '').toLowerCase();
      if (v.includes('bus') || v.includes('minibus')) return 0.85;
      if (v.includes('van')) return 0.30;
      return 0.22; // sedan/suv default
    };

    let totalCo2Kg = 0;
    const byMonth: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};

    for (const b of inPeriod) {
      const km = b.distanceKm ?? b.distance ?? 10;
      const co2 = km * co2PerKm(b.vehicleType);
      totalCo2Kg += co2;

      const d = new Date(b.completedAt ?? b.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = (byMonth[monthKey] ?? 0) + co2;

      const dept = b.department ?? b.metadata?.department ?? 'General';
      byDepartment[dept] = (byDepartment[dept] ?? 0) + co2;
    }

    // VS last month (sólo aplica al período month)
    let vsLastMonth = 0;
    if (period === 'month') {
      const prevCutoff = new Date(cutoff);
      prevCutoff.setMonth(prevCutoff.getMonth() - 1);
      const prevPeriod = completed.filter((b) => {
        const d = new Date(b.completedAt ?? b.createdAt);
        return d >= prevCutoff && d < cutoff;
      });
      const prevCo2 = prevPeriod.reduce((s, b) => s + ((b.distanceKm ?? 10) * co2PerKm(b.vehicleType)), 0);
      if (prevCo2 > 0) {
        vsLastMonth = ((totalCo2Kg - prevCo2) / prevCo2) * 100;
      }
    }

    return {
      period,
      totalTrips: inPeriod.length,
      totalCo2Kg: parseFloat(totalCo2Kg.toFixed(2)),
      vsLastMonth: parseFloat(vsLastMonth.toFixed(1)),
      byMonth: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, co2kg]) => ({ month, co2kg: parseFloat(co2kg.toFixed(2)) })),
      byDepartment: Object.entries(byDepartment)
        .sort(([, a], [, b]) => b - a)
        .map(([dept, co2kg]) => ({ department: dept, co2kg: parseFloat(co2kg.toFixed(2)) })),
    };
  }

  // ── Seguridad: viajes + dashcam ────────────────────────────────────────

  async getSafetyTrips(companyId: string, token: string): Promise<any[]> {
    const bookings = await this.companyBookings(companyId, token);
    // Mapeamos a la forma TripSafety esperada por el frontend.
    return bookings.slice(0, 50).map((b) => ({
      id: b.id ?? b._id,
      passengerName: b.userName ?? b.passengerName,
      driverName: b.driverName ?? b.driver?.name,
      vehiclePlate: b.vehiclePlate ?? b.vehicle?.plate,
      serviceType: b.serviceType ?? 'transport',
      status: b.status,
      startedAt: b.startedAt ?? b.createdAt,
      completedAt: b.completedAt,
      destination: b.metadata?.destination ?? b.destination,
      recordingRequested: false,
      // Eventos de seguridad: por ahora 0; cuando tracking-service exponga
      // hard-brake/over-speed events, agregar aquí.
      events: { hardBrake: 0, overSpeed: 0, drowsiness: 0 },
    }));
  }

  // Las solicitudes de clip se persisten (DashcamClipRequestRepository). Los
  // "incidents" provendrían de un dashcam-service real que aún no existe, así
  // que por ahora se devuelve lista vacía.
  async getDashcamIncidents(_companyId: string): Promise<any[]> {
    return [];
  }

  async requestDashcamClip(companyId: string, userId: string, tripId: string) {
    const request = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tripId,
      requestedBy: userId,
      companyId,
      status: 'pending', // pending | ready | denied
      createdAt: new Date().toISOString(),
    };
    await this.clipRequestRepo.create(request);
    this.logger.log(`Clip request ${request.id} for trip=${tripId} by user=${userId}`);
    return request;
  }

  // ── Empresas: lista derivada de user-auth ──────────────────────────────

  /**
   * Lista todas las empresas derivándolas de los users corporativos del
   * user-auth-service. Agrupa por companyId, toma el primer "admin" como
   * representante de la empresa.
   */
  async listAllCompanies(token: string, limit: number): Promise<{ companies: any[] }> {
    const data = await this.fetchJson(
      `${this.authUrl}/auth/admin/users?limit=${limit}`,
      token,
    ).catch(() => null);

    const users: any[] = Array.isArray(data)
      ? data
      : (data as any)?.users ?? [];

    // Agrupa por companyId
    const byCompany = new Map<string, any>();
    for (const u of users) {
      const cid = u.companyId ?? u.company?.id;
      if (!cid) continue;
      const existing = byCompany.get(cid);
      if (!existing) {
        byCompany.set(cid, {
          id: cid,
          name: u.companyName ?? u.company?.name ?? cid,
          email: u.email,
          ruc: u.companyRuc ?? u.company?.ruc ?? '—',
          status: u.status === 'active' ? 'active' : (u.status ?? 'prospect'),
          tipoCuenta: u.tipoCuenta ?? u.company?.tipoCuenta ?? 'negocio',
          industry: u.industry ?? u.company?.industry,
          city: u.city ?? u.company?.city,
          phone: u.phone ?? u.company?.phone,
          employees: 1,
          createdAt: u.createdAt ?? new Date().toISOString(),
          adminUserId: u.id,
        });
      } else {
        existing.employees += 1;
      }
    }

    const companies = Array.from(byCompany.values());

    // Merge de las SOLICITUDES web (prospectos del formulario público) como
    // entradas 'prospect' → aparecen en la pestaña "Solicitudes" del admin sin
    // tocar el frontend. Su id es el _id de la solicitud (approve/reject lo
    // detectan y delegan a decideApplication).
    try {
      const apps = await this.applicationRepo.findAll(undefined, 200);
      for (const a of apps as any[]) {
        if (!['prospect', 'contacted'].includes(a.estado)) continue;
        companies.push({
          id: String(a._id),
          name: a.razonSocial,
          email: a.contactoEmail,
          ruc: a.ruc,
          status: 'prospect',
          tipoCuenta: a.tipoCuenta ?? 'negocio',
          industry: undefined,
          city: a.ciudad,
          phone: a.contactoTelefono,
          employees: a.empleadosEstimados ?? 0,
          createdAt: a.createdAt ?? new Date().toISOString(),
          descripcionUso: a.notas,
          source: 'application',
          rucValido: a.rucValido,
        });
      }
    } catch (e) {
      this.logger.warn(`No se pudieron mezclar solicitudes web: ${(e as Error).message}`);
    }

    return { companies };
  }

  async getCompanyById(token: string, id: string): Promise<any | null> {
    const { companies } = await this.listAllCompanies(token, 500);
    return companies.find((c) => c.id === id) ?? null;
  }

  async updateCompany(token: string, id: string, data: any): Promise<any> {
    // Por ahora actualizamos el companyId del admin user en user-auth.
    // Cuando se cree un Company schema dedicado, esto cambia.
    this.logger.log(`updateCompany ${id} payload=${JSON.stringify(data).slice(0, 200)}`);
    return { id, ...data, updatedAt: new Date().toISOString() };
  }

  async approveCompany(
    token: string,
    id: string,
    tipoCuenta: string,
    decidedBy: string,
  ): Promise<any> {
    // Si el id es una SOLICITUD web (prospecto del formulario): PROVISIONA la
    // cuenta corporativa (crea el usuario admin de la empresa con companyId +
    // role='corporate' en user-auth-service, reenviando el token del staff que
    // aprueba) y luego marca la solicitud approved con su companyId. La persona
    // recibe un email para definir su contraseña y entrar al portal Empresas.
    const app = await this.applicationRepo.findById(id).catch(() => null);
    if (app) {
      const a = app as any;
      const companyId = `comp_${randomUUID()}`;
      let provisioned = false;
      let resetLink: string | null = null;
      try {
        const res = await this.postJson(`${this.authUrl}/auth/admin/create-corporate-user`, token, {
          email: a.contactoEmail,
          firstName: a.contactoNombre,
          companyId,
          companyName: a.razonSocial,
        });
        provisioned = true;
        resetLink = (res as any)?.resetLink ?? null;
      } catch (e) {
        this.logger.warn(`No se pudo provisionar la cuenta corporativa (solicitud ${id}): ${(e as Error).message}`);
      }
      await this.decideApplication(id, 'approved', decidedBy, provisioned ? companyId : undefined);
      return {
        id,
        status: 'active',
        tipoCuenta,
        approvedBy: decidedBy,
        approvedAt: new Date().toISOString(),
        source: 'application',
        companyId: provisioned ? companyId : null,
        provisioned,
        resetLink,
      };
    }
    // En una versión completa, esto:
    //  1. Actualiza el status del usuario admin de la empresa a 'active'
    //  2. Setea companyTipoCuenta en su user record
    //  3. Notifica al admin por email
    // Por ahora retornamos el ack y dejamos el cableo para post-launch.
    this.logger.log(`Company ${id} approved as tipoCuenta=${tipoCuenta} by ${decidedBy}`);
    return {
      id,
      status: 'active',
      tipoCuenta,
      approvedBy: decidedBy,
      approvedAt: new Date().toISOString(),
    };
  }

  async rejectCompany(
    token: string,
    id: string,
    motivo: string,
    decidedBy: string,
  ): Promise<any> {
    // Solicitud web → delegar a decideApplication (estado=rejected).
    const app = await this.applicationRepo.findById(id).catch(() => null);
    if (app) {
      await this.decideApplication(id, 'rejected', decidedBy);
      return { id, status: 'rejected', motivo, rejectedBy: decidedBy, rejectedAt: new Date().toISOString(), source: 'application' };
    }
    this.logger.log(`Company ${id} rejected by ${decidedBy}: ${motivo}`);
    return {
      id,
      status: 'rejected',
      motivo,
      rejectedBy: decidedBy,
      rejectedAt: new Date().toISOString(),
    };
  }

  async updateCompanyStatus(
    token: string,
    id: string,
    status: 'active' | 'suspended',
    changedBy: string,
  ): Promise<any> {
    this.logger.log(`Company ${id} status -> ${status} by ${changedBy}`);
    return {
      id,
      status,
      statusChangedBy: changedBy,
      statusChangedAt: new Date().toISOString(),
    };
  }

  // ── HTTP helpers ───────────────────────────────────────────────────────

  /**
   * Lee el detalle del error del servicio downstream y lo propaga con el MISMO
   * status. Antes se tiraba `new Error('400 from <url>')`: se perdía el motivo
   * (p.ej. qué campo no pasó validación) y Nest lo convertía en un 500 opaco,
   * así que el usuario veía "Internal server error" ante un simple 400.
   */
  private async throwDownstream(res: Response, url: string): Promise<never> {
    const raw = await res.text().catch(() => '');
    let detail = raw;
    try {
      const parsed = JSON.parse(raw);
      const m = (parsed as any)?.message;
      detail = Array.isArray(m) ? m.join('; ') : (m ?? raw);
    } catch {
      /* no era JSON — se usa el texto crudo */
    }
    this.logger.warn(`Downstream ${res.status} en ${url}: ${detail?.slice(0, 500)}`);
    throw new HttpException(
      { statusCode: res.status, message: detail || `Error ${res.status} del servicio`, upstream: url },
      res.status,
    );
  }

  private async fetchJson(url: string, token: string): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) await this.throwDownstream(res, url);
    return res.json();
  }

  private async postJson(url: string, token: string, body: unknown): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) await this.throwDownstream(res, url);
    return res.json();
  }

  private settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === 'fulfilled' ? result.value : fallback;
  }
}
