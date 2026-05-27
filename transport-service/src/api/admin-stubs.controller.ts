/**
 * Admin Stubs Controller
 *
 * Endpoints que el admin-dashboard llama y todavía no tienen un servicio
 * dedicado en el monorepo. Se mantienen como stubs aquí para que las
 * páginas /admin/vehicles, /admin/dashcam, /admin/surge dejen de tirar
 * 404 desde el api-gateway y muestren datos coherentes.
 *
 * Conforme cada feature gane su servicio propio, los endpoints
 * correspondientes se migran allá:
 *   - /vehicles → eventualmente un VehiclesController con su propio modelo,
 *     hoy retornamos lista vacía (el admin lo cubre con empty state).
 *   - /dashcam/* → cuando exista dashcam-service.
 *   - /pricing/surge/* → cuando se separe el pricing-service.
 */

import {
  Controller, Get, Patch, Post, Delete,
  Param, Body, Logger, BadRequestException,
} from '@nestjs/common';

// ─── Tipos de respuesta ───────────────────────────────────────────────────

interface VehicleRow {
  id: string;
  driverId: string;
  driverName?: string;
  driverEmail?: string;
  driverPhone?: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  type?: string;
  capacity?: number;
  status?: string;
  approved?: boolean;
  soatExpiry?: string;
  soatUrl?: string;
  matriculaExpiry?: string;
  matriculaUrl?: string;
  technicalExpiry?: string;
  photoUrl?: string;
  createdAt?: string;
}

interface DashcamIncident {
  id: string;
  driverId?: string;
  driverName?: string;
  tripId?: string;
  type: 'collision' | 'hardBrake' | 'overSpeed' | 'drowsiness' | 'other';
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'reviewed' | 'dismissed';
  description?: string;
  videoUrl?: string;
  detectedAt: string;
  reviewedAt?: string;
}

interface SurgeRule {
  id: string;
  zoneName: string;
  multiplier: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  reason?: string;
  createdAt: string;
  updatedAt?: string;
}

@Controller()
export class AdminStubsController {
  private readonly logger = new Logger(AdminStubsController.name);

  // In-memory stores — reemplazables por schema cuando se separe el feature.
  // Por proceso, no por contenedor — se pierden con cada deploy. Para datos
  // permanentes mover a su propio repository.
  private readonly dashcamIncidents: DashcamIncident[] = [];
  private readonly surgeRules: SurgeRule[] = [];

  // ── /vehicles ──────────────────────────────────────────────────────────

  /**
   * GET /vehicles?limit=200 — Lista de vehículos.
   *
   * Hoy retorna lista vacía: los datos de vehículos viven en el perfil del
   * driver dentro de user-auth-service, y este endpoint todavía no tiene
   * el cableo cross-service. El admin-dashboard cubre el empty state con
   * "No hay vehículos registrados aún" y filtros sin resultados.
   *
   * Cuando se priorice, ver la solución larga:
   *   - Cliente HTTP a user-auth /admin/users?role=driver
   *   - Map de user → vehicle (a partir de los campos vehicle.* del User schema)
   *   - Cache TTL corto (60s) para reducir carga
   */
  @Get('vehicles')
  async listVehicles(): Promise<{ data: VehicleRow[]; total: number }> {
    return { data: [], total: 0 };
  }

  // ── /dashcam/incidents ─────────────────────────────────────────────────

  /**
   * GET /dashcam/incidents — Lista de incidentes detectados.
   * Por ahora retorna el store in-memory; cuando exista dashcam-service
   * se conecta a su API.
   */
  @Get('dashcam/incidents')
  async listIncidents(): Promise<{ incidents: DashcamIncident[]; total: number }> {
    return {
      incidents: this.dashcamIncidents,
      total: this.dashcamIncidents.length,
    };
  }

  /**
   * PATCH /dashcam/incidents/:id/review — Marca como revisado.
   */
  @Patch('dashcam/incidents/:id/review')
  async reviewIncident(@Param('id') id: string): Promise<DashcamIncident> {
    const inc = this.dashcamIncidents.find((i) => i.id === id);
    if (!inc) throw new BadRequestException(`Incident ${id} not found`);
    inc.status = 'reviewed';
    inc.reviewedAt = new Date().toISOString();
    this.logger.log(`Incident ${id} reviewed`);
    return inc;
  }

  /**
   * PATCH /dashcam/incidents/:id/dismiss — Descarta el incidente como
   * falso positivo (no requiere acción).
   */
  @Patch('dashcam/incidents/:id/dismiss')
  async dismissIncident(@Param('id') id: string): Promise<DashcamIncident> {
    const inc = this.dashcamIncidents.find((i) => i.id === id);
    if (!inc) throw new BadRequestException(`Incident ${id} not found`);
    inc.status = 'dismissed';
    inc.reviewedAt = new Date().toISOString();
    this.logger.log(`Incident ${id} dismissed`);
    return inc;
  }

  // ── /pricing/surge/rules ───────────────────────────────────────────────

  /**
   * GET /pricing/surge/rules — Reglas de surge pricing activas.
   * Cuando se separe el pricing-service, este endpoint se migra.
   */
  @Get('pricing/surge/rules')
  async listSurgeRules(): Promise<{ rules: SurgeRule[] }> {
    return { rules: this.surgeRules };
  }

  /**
   * POST /pricing/surge/rules — Crea una nueva regla.
   */
  @Post('pricing/surge/rules')
  async createSurgeRule(@Body() body: Partial<SurgeRule>): Promise<SurgeRule> {
    if (!body?.zoneName || !body?.multiplier) {
      throw new BadRequestException('zoneName and multiplier are required');
    }
    const rule: SurgeRule = {
      id: `surge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      zoneName: body.zoneName,
      multiplier: Number(body.multiplier),
      active: body.active ?? true,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      reason: body.reason,
      createdAt: new Date().toISOString(),
    };
    this.surgeRules.unshift(rule);
    this.logger.log(`Surge rule ${rule.id} created for zone=${rule.zoneName} x${rule.multiplier}`);
    return rule;
  }

  /**
   * PATCH /pricing/surge/rules/:id — Pausa/reactiva o modifica una regla.
   */
  @Patch('pricing/surge/rules/:id')
  async updateSurgeRule(
    @Param('id') id: string,
    @Body() body: Partial<SurgeRule>,
  ): Promise<SurgeRule> {
    const rule = this.surgeRules.find((r) => r.id === id);
    if (!rule) throw new BadRequestException(`Rule ${id} not found`);
    if (body.active !== undefined) rule.active = body.active;
    if (body.multiplier !== undefined) rule.multiplier = Number(body.multiplier);
    if (body.zoneName !== undefined) rule.zoneName = body.zoneName;
    if (body.startsAt !== undefined) rule.startsAt = body.startsAt;
    if (body.endsAt !== undefined) rule.endsAt = body.endsAt;
    if (body.reason !== undefined) rule.reason = body.reason;
    rule.updatedAt = new Date().toISOString();
    this.logger.log(`Surge rule ${id} updated: active=${rule.active}`);
    return rule;
  }

  /**
   * DELETE /pricing/surge/rules/:id — Borra una regla.
   */
  @Delete('pricing/surge/rules/:id')
  async deleteSurgeRule(@Param('id') id: string): Promise<{ deleted: true; id: string }> {
    const idx = this.surgeRules.findIndex((r) => r.id === id);
    if (idx < 0) throw new BadRequestException(`Rule ${id} not found`);
    this.surgeRules.splice(idx, 1);
    this.logger.log(`Surge rule ${id} deleted`);
    return { deleted: true, id };
  }
}
