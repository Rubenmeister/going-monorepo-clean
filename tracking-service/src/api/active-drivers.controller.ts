import {
  Controller,
  Get,
  Inject,
  Param,
  Req,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ITrackingRepository, JwtAuthGuard } from '../domain/ports';
import { InternalServiceGuard } from '../infrastructure/auth/internal-service.guard';

interface ActiveDriversRepo {
  findAllActive(): Promise<{
    isErr(): boolean;
    value: unknown[];
    error?: Error;
  }>;
}

/** Roles con permiso para ver el panel operativo de conductores activos. */
const ADMIN_ROLES = new Set([
  'admin',
  'super_admin',
  'ops',
  'ADMIN',
  'SUPER_ADMIN',
  'OPS',
]);

/**
 * Admin endpoint to get all active drivers.
 * Injects the LOCAL ITrackingRepository symbol (from ../domain/ports)
 * which matches what InfrastructureModule provides (RedisTrackingRepository).
 */
@Controller('tracking')
export class ActiveDriversController {
  constructor(
    @Inject(ITrackingRepository)
    private readonly repo: ActiveDriversRepo
  ) {}

  /**
   * Volcado masivo de TODAS las posiciones GPS en vivo → solo operaciones/admin.
   * Blindaje (auditoría Bloque 2 #7): antes SIN guard → cualquier usuario
   * autenticado (o anónimo si el servicio es público) cosechaba la ubicación de
   * toda la flota. Ahora exige JWT + rol admin/ops. Lo consume el admin-dashboard
   * (use-monorepo-app.hook) con token de administración.
   */
  @Get('active-drivers')
  @UseGuards(JwtAuthGuard)
  async getActiveDrivers(@Req() req: any): Promise<unknown[]> {
    if (!ADMIN_ROLES.has(req.user?.role)) {
      throw new ForbiddenException('Admin/ops role required');
    }
    try {
      const result = await this.repo.findAllActive();
      if (result.isErr()) return [];
      return result.value;
    } catch {
      return [];
    }
  }

  /**
   * Public endpoint que retorna la última ubicación de un driver específico.
   * Usado por envios-service para incluir tracking en GET /parcels/:id mientras
   * el paquete está en tránsito. Retorna null si el driver no está activo.
   *
   * GET /tracking/drivers/:driverId/location
   *
   * Blindaje (auditoría Bloque 2 #6/#10): antes SIN auth con el supuesto de que
   * era "internal-only por VPC" — falso, el servicio es alcanzable y cualquiera
   * podía geolocalizar a un conductor por su id. Ahora exige X-Internal-Token
   * (InternalServiceGuard). El único caller legítimo es envios-service, que
   * manda el token; el cliente público sigue llegando vía /parcels/:id (que
   * valida ownership) → envios → este endpoint con token.
   */
  @Get('drivers/:driverId/location')
  @UseGuards(InternalServiceGuard)
  async getDriverLocation(
    @Param('driverId') driverId: string,
  ): Promise<{ lat: number; lng: number; lastUpdated?: Date } | null> {
    try {
      const result = await this.repo.findAllActive();
      if (result.isErr()) return null;
      const drivers = (result.value ?? []) as any[];
      const match = drivers.find(
        (d) =>
          d.driverId === driverId ||
          d.id === driverId ||
          d.userId === driverId,
      );
      if (!match) return null;
      const lat = match.lat ?? match.latitude ?? match.coords?.lat;
      const lng = match.lng ?? match.longitude ?? match.coords?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      return {
        lat,
        lng,
        lastUpdated: match.lastUpdated ?? match.updatedAt ?? match.timestamp,
      };
    } catch {
      return null;
    }
  }
}
