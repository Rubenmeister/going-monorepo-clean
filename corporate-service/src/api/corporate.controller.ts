import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  Req, Logger, BadRequestException, NotFoundException,
  UnauthorizedException, ForbiddenException, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CorporateService } from './corporate.service';
import { JwtAuthGuard } from '../infrastructure/auth/jwt-auth.guard';

@Controller('corporate')
@UseGuards(JwtAuthGuard)
export class CorporateController {
  private readonly logger = new Logger(CorporateController.name);

  constructor(private readonly svc: CorporateService) {}

  /** GET /corporate/stats — Dashboard summary */
  @Get('stats')
  async getStats(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.getStats(companyId, token);
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
    const companyId = this.extractCompanyId(req);
    await this.svc.assertCompanyAdmin(companyId, this.extractUserId(req), this.isPlatformAdmin(req), 'setSpendingLimit');
    return this.svc.setSpendingLimit(companyId, body);
  }

  /** GET /corporate/spending-report?month=YYYY-MM — gasto por empleado + límites */
  @Get('spending-report')
  async spendingReport(@Req() req: Request, @Query('month') month?: string) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.getSpendingReport(companyId, token, month);
  }

  /** GET /corporate/billing/statement?month=YYYY-MM — estado de cuenta mensual (preview) */
  @Get('billing/statement')
  async billingStatement(@Req() req: Request, @Query('month') month?: string) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.getMonthlyStatement(companyId, token, month);
  }

  /** POST /corporate/billing/invoices/generate?month=YYYY-MM — materializa la factura del mes */
  @Post('billing/invoices/generate')
  async generateInvoice(
    @Req() req: Request,
    @Query('month') queryMonth?: string,
    @Body() body?: { month?: string },
  ) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.generateMonthlyInvoice(companyId, token, body?.month ?? queryMonth);
  }

  /** GET /corporate/billing/invoices — facturas consolidadas persistidas */
  @Get('billing/invoices')
  async listCorporateInvoices(@Req() req: Request) {
    return this.svc.listCorporateInvoices(this.extractCompanyId(req));
  }

  /** GET /corporate/billing/invoices/:id */
  @Get('billing/invoices/:id')
  async getCorporateInvoice(@Param('id') id: string, @Req() req: Request) {
    const invoice = await this.svc.getCorporateInvoice(this.extractCompanyId(req), id);
    if (!invoice) throw new NotFoundException(`Factura ${id} no encontrada`);
    return invoice;
  }

  /** PATCH /corporate/billing/invoices/:id/pay — marca la factura como pagada */
  @Patch('billing/invoices/:id/pay')
  async payCorporateInvoice(@Param('id') id: string, @Req() req: Request) {
    // Bloque 3: conciliar el pago de una factura es acción de staff Going, no de
    // la propia empresa (conflicto de interés) → exige rol admin de plataforma.
    this.requireAdmin(req);
    const invoice = await this.svc.markInvoicePaid(this.extractCompanyId(req), id);
    if (!invoice) throw new NotFoundException(`Factura ${id} no encontrada`);
    return invoice;
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
    const companyId = this.extractCompanyId(req);
    const decidedBy = this.extractUserId(req);
    return this.svc.decideApproval(companyId, id, body.decision, decidedBy, body.comments ?? '');
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
    await this.svc.assertCompanyAdmin(companyId, this.extractUserId(req), this.isPlatformAdmin(req), 'updateSettings');
    return this.svc.updateSettings(companyId, body);
  }

  /**
   * GET /corporate/policy — Política de viajes vigente (Gap #2).
   * Si nunca se configuró, retorna defaults (enabled=false, sin restricciones).
   */
  @Get('policy')
  async getTravelPolicy(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    return this.svc.getTravelPolicy(companyId);
  }

  /**
   * PUT /corporate/policy — Actualiza la política. Valida coherencia
   * (autoApprove < requireApproval < maxPerTrip) y audita changedBy/changedAt.
   * Scope: global a la empresa.
   */
  @Put('policy')
  async updateTravelPolicy(@Req() req: Request, @Body() body: any) {
    const companyId = this.extractCompanyId(req);
    const changedBy = this.extractUserId(req);
    await this.svc.assertCompanyAdmin(companyId, changedBy, this.isPlatformAdmin(req), 'updatePolicy');
    return this.svc.updateTravelPolicy(companyId, changedBy, body);
  }

  // ── Admins de empresa (Bloque 3 #5, Opción B) ───────────────────────────
  /** GET /corporate/admins — lista los admins de la empresa del que llama. */
  @Get('admins')
  async listAdmins(@Req() req: Request) {
    return { adminUserIds: await this.svc.listCompanyAdmins(this.extractCompanyId(req)) };
  }

  /** POST /corporate/admins { userId } — agrega un admin (bootstrap si no hay ninguno). */
  @Post('admins')
  async addAdmin(@Req() req: Request, @Body() body: { userId: string }) {
    const companyId = this.extractCompanyId(req);
    const adminUserIds = await this.svc.addCompanyAdmin(
      companyId, this.extractUserId(req), this.isPlatformAdmin(req), body?.userId,
    );
    return { adminUserIds };
  }

  /** DELETE /corporate/admins/:userId — quita un admin (nunca deja 0). */
  @Delete('admins/:userId')
  async removeAdmin(@Req() req: Request, @Param('userId') userId: string) {
    const companyId = this.extractCompanyId(req);
    const adminUserIds = await this.svc.removeCompanyAdmin(
      companyId, this.extractUserId(req), this.isPlatformAdmin(req), userId,
    );
    return { adminUserIds };
  }

  /** GET /corporate/employees */
  @Get('employees')
  async listEmployees(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.listEmployees(companyId, token);
  }

  // ── Equipo: invitaciones a nuevos miembros ─────────────────────────────

  /**
   * POST /corporate/invite — Invita a un nuevo miembro al equipo
   * corporativo. Envía email con link de registro pre-completado.
   * Usado por /empresas/panel/equipo (botón "+ Invitar miembro").
   */
  @Post('invite')
  async inviteTeamMember(
    @Req() req: Request,
    @Body() body: {
      email: string;
      firstName?: string;
      lastName?: string;
      role: string;
      companyId: string;
    },
  ) {
    if (!body?.email || !body?.role) {
      throw new BadRequestException('email and role are required');
    }
    const companyId = body.companyId || this.extractCompanyId(req);
    const invitedBy = this.extractUserId(req);
    await this.svc.assertCompanyAdmin(companyId, invitedBy, this.isPlatformAdmin(req), 'inviteTeamMember');
    return this.svc.inviteTeamMember(companyId, invitedBy, {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
    });
  }

  // ── Quotes (cotizaciones corporativas para eventos / grupos) ───────────

  /**
   * GET /corporate/quotes — Lista cotizaciones de la empresa.
   * Usado por /empresas/panel/cotizacion para mostrar histórico.
   */
  @Get('quotes')
  async listQuotes(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    return this.svc.listQuotes(companyId);
  }

  /**
   * POST /corporate/quotes — Crea una nueva solicitud de cotización
   * (grupos, eventos, traslados especiales). El equipo ops la revisa
   * y responde por email/WhatsApp.
   */
  @Post('quotes')
  async createQuote(@Req() req: Request, @Body() body: any) {
    const companyId = this.extractCompanyId(req);
    const userId = this.extractUserId(req);
    return this.svc.createQuote(companyId, userId, body);
  }

  // ── Mapa / tracking en vivo de empleados ────────────────────────────────

  /**
   * GET /corporate/bookings/active — Viajes corporativos en curso o programados
   * próximos. Usado por /empresas/panel/mapa para mostrar empleados en ruta.
   * Solo retorna viajes donde el empleado dio consent (consentGiven=true).
   */
  @Get('bookings/active')
  async getActiveBookings(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.getActiveBookings(companyId, token);
  }

  // ── Sostenibilidad (ESG) ────────────────────────────────────────────────

  /**
   * GET /corporate/sustainability?period=month|quarter|year — Huella de
   * carbono y agregados ESG. Usado por /empresas/panel/sostenibilidad.
   */
  @Get('sustainability')
  async getSustainabilityReport(
    @Req() req: Request,
    @Query('period') period: 'month' | 'quarter' | 'year' = 'month',
  ) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.getSustainabilityReport(companyId, token, period);
  }

  // ── Seguridad (trips + dashcam) ─────────────────────────────────────────

  /**
   * GET /corporate/trips/safety — Viajes recientes con métricas de
   * seguridad (eventos: frenado brusco, exceso velocidad, etc.).
   * Usado por /empresas/panel/seguridad.
   */
  @Get('trips/safety')
  async getSafetyTrips(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    const token = this.extractToken(req);
    return this.svc.getSafetyTrips(companyId, token);
  }

  /**
   * GET /corporate/dashcam/incidents — Incidentes detectados por dashcam
   * (colisión, frenadas, somnolencia conductor, etc.).
   */
  @Get('dashcam/incidents')
  async getDashcamIncidents(@Req() req: Request) {
    const companyId = this.extractCompanyId(req);
    return this.svc.getDashcamIncidents(companyId);
  }

  /**
   * POST /corporate/dashcam/clip-request — Solicita el clip de video de
   * un viaje específico para evidencia / análisis.
   */
  @Post('dashcam/clip-request')
  async requestDashcamClip(@Req() req: Request, @Body() body: { tripId: string }) {
    if (!body?.tripId) {
      throw new BadRequestException('tripId required');
    }
    const companyId = this.extractCompanyId(req);
    const userId = this.extractUserId(req);
    return this.svc.requestDashcamClip(companyId, userId, body.tripId);
  }

  // ── Empresas (admin only — gestión de clientes corporativos) ────────────

  /**
   * GET /corporate/companies?limit=200 — Lista todas las empresas que usan
   * Going (activas + solicitudes). Solo accesible por admin global.
   * Derivado del user-auth-service: agrupa users con role=corporate por
   * companyId para reconstruir la lista de empresas.
   */
  @Get('companies')
  async listCompanies(@Req() req: Request, @Query('limit') limit = '200') {
    this.requireAdmin(req);
    const token = this.extractToken(req);
    return this.svc.listAllCompanies(token, +limit);
  }

  /**
   * GET /corporate/companies/:id — Detalle de una empresa.
   */
  @Get('companies/:id')
  async getCompany(@Param('id') id: string, @Req() req: Request) {
    this.requireAdmin(req);
    const token = this.extractToken(req);
    const company = await this.svc.getCompanyById(token, id);
    if (!company) throw new NotFoundException(`Empresa ${id} no encontrada`);
    return company;
  }

  /**
   * PUT /corporate/companies/:id — Actualiza datos de la empresa (admin).
   */
  @Put('companies/:id')
  async updateCompany(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    this.requireAdmin(req);
    const token = this.extractToken(req);
    return this.svc.updateCompany(token, id, body);
  }

  /**
   * POST /corporate/companies/:id/approve — Aprueba la solicitud de alta
   * de una empresa. Le asigna tipoCuenta (negocio | grande | agencia) y
   * activa el acceso al portal corporativo.
   */
  @Post('companies/:id/approve')
  async approveCompany(
    @Param('id') id: string,
    @Body() body: { tipoCuenta?: string },
    @Req() req: Request,
  ) {
    this.requireAdmin(req);
    const token = this.extractToken(req);
    const userId = this.extractUserId(req);
    return this.svc.approveCompany(token, id, body?.tipoCuenta ?? 'negocio', userId);
  }

  /**
   * POST /corporate/companies/:id/reject — Rechaza la solicitud. Notifica
   * al solicitante con el motivo.
   */
  @Post('companies/:id/reject')
  async rejectCompany(
    @Param('id') id: string,
    @Body() body: { motivo?: string },
    @Req() req: Request,
  ) {
    this.requireAdmin(req);
    const token = this.extractToken(req);
    const userId = this.extractUserId(req);
    return this.svc.rejectCompany(token, id, body?.motivo ?? '', userId);
  }

  /**
   * PATCH /corporate/companies/:id/status — Cambia el estado de una empresa
   * activa (suspender / reactivar). El body lleva `{ status: 'active' | 'suspended' }`.
   */
  @Patch('companies/:id/status')
  async updateCompanyStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'suspended' },
    @Req() req: Request,
  ) {
    if (!body?.status || !['active', 'suspended'].includes(body.status)) {
      throw new BadRequestException('status must be "active" or "suspended"');
    }
    this.requireAdmin(req);
    const token = this.extractToken(req);
    const userId = this.extractUserId(req);
    return this.svc.updateCompanyStatus(token, id, body.status, userId);
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private extractToken(req: Request): string {
    // El token YA fue verificado por JwtAuthGuard (firma + expiración). Se
    // extrae el raw SOLO para forwardearlo a los servicios downstream
    // (booking, etc.) que validan su propia firma.
    const auth = (req.headers as any)['authorization'] ?? '';
    return auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  }

  private extractCompanyId(req: Request): string {
    // req.user lo pobló JwtAuthGuard tras verificar la FIRMA del JWT
    // (auditoría #2 — antes se decodificaba el payload base64 SIN verificar
    // firma, permitiendo forjar companyId con alg:none). Si el token no trae
    // companyId, 401 en vez de caer a un pool compartido (fuga cross-tenant).
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      throw new UnauthorizedException('companyId no presente en el token');
    }
    return companyId;
  }

  /** Exige rol admin — roles del JWT verificado (req.user), no del body. */
  private requireAdmin(req: Request): void {
    const roles: string[] = (req as any).user?.roles ?? [];
    if (!roles.includes('admin')) {
      throw new ForbiddenException('Se requiere rol admin');
    }
  }

  /** True si el JWT es de staff Going (rol admin de plataforma). */
  private isPlatformAdmin(req: Request): boolean {
    return ((req as any).user?.roles ?? []).includes('admin');
  }

  private extractUserId(req: Request): string {
    const u = (req as any).user;
    return u?.userId ?? u?.id ?? 'unknown';
  }
}
