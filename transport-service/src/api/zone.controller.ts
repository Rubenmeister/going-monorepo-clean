import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@going-monorepo-clean/shared-infrastructure';
import {
  CreateZoneUseCase,
  UpdateZoneUseCase,
  DeleteZoneUseCase,
  ListZonesUseCase,
  FindZonesContainingPointUseCase,
  CreateZoneInput,
  UpdateZoneInput,
} from '@going-monorepo-clean/domains-transport-application';
import {
  Zone,
  ZoneKind,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

function requireAdmin(roles: string[] | undefined) {
  if (!roles?.includes('admin')) {
    throw new ForbiddenException('Admin role required');
  }
}

/**
 * ZoneController — geocercas administradas.
 *
 * CRUD /admin/zones   → sólo admin
 * GET  /zones/match   → público autenticado (mobile + webapp consultan)
 * GET  /zones         → público autenticado (listar activas)
 */
@Controller('zones')
@UseGuards(AuthGuard('jwt'))
export class ZoneController {
  constructor(
    private readonly createZone: CreateZoneUseCase,
    private readonly updateZone: UpdateZoneUseCase,
    private readonly deleteZone: DeleteZoneUseCase,
    private readonly listZones: ListZonesUseCase,
    private readonly findZonesContainingPoint: FindZonesContainingPointUseCase,
  ) {}

  /**
   * GET /zones — lista zonas activas (cualquier user autenticado puede
   * consultar para pintarlas en el mapa de la app).
   *
   * Query: ?kind=service_area|no_service|priority|restricted&active=true
   */
  @Get()
  async list(
    @Query('kind') kind?: ZoneKind,
    @Query('active') active?: string,
  ) {
    const zones = await this.listZones.execute({
      kind,
      active: active === undefined ? true : active === 'true',
    });
    return zones.map((z) => z.toGeoJSON());
  }

  /**
   * GET /zones/match?lat=X&lng=Y — devuelve qué zonas cubren un punto
   * y el agregado útil (inServiceArea, totalSurchargePct, etc.).
   *
   * Usado por mobile antes de permitir pedir un viaje y por MatchAvailableDrivers.
   */
  @Get('match')
  async match(@Query('lat') lat: string, @Query('lng') lng: string) {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(ln)) {
      throw new BadRequestException('lat and lng are required numbers');
    }
    const res = await this.findZonesContainingPoint.execute(ln, la);
    return {
      inServiceArea: res.inServiceArea,
      blockedByNoService: res.blockedByNoService,
      totalSurchargePct: res.totalSurchargePct,
      // Zonas rojas/peligrosas: la app del conductor las usa para alertar.
      // NO bloquean el servicio; sólo informan (name + notes = texto del riesgo).
      inDangerZone: res.dangerZones.length > 0,
      dangerZones: res.dangerZones.map((z) => ({ id: z.id, name: z.name, notes: z.notes })),
      zones: res.zones.map((z) => z.toGeoJSON()),
    };
  }

  // ── Admin CRUD ────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('roles') roles: string[],
    @Body() body: CreateZoneInput,
  ) {
    requireAdmin(roles);
    const zone = await this.createZone.execute(body);
    return zone.toGeoJSON();
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser('roles') roles: string[],
    @Param('id') id: UUID,
    @Body() changes: UpdateZoneInput['changes'],
  ) {
    requireAdmin(roles);
    const zone = await this.updateZone.execute({ id, changes });
    return zone.toGeoJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('roles') roles: string[],
    @Param('id') id: UUID,
    @Query('hard') hard?: string,
  ) {
    requireAdmin(roles);
    return this.deleteZone.execute(id, { hard: hard === 'true' });
  }
}
