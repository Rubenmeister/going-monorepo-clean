import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ITrackingRepository } from '../domain/ports';

interface ActiveDriversRepo {
  findAllActive(): Promise<{
    isErr(): boolean;
    value: unknown[];
    error?: Error;
  }>;
}

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

  @Get('active-drivers')
  async getActiveDrivers(): Promise<unknown[]> {
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
   * NOTA: Sin auth porque es internal-only (envios-service en mismo VPC).
   * Privacy: el cliente público solo puede llegar a este endpoint vía
   * /parcels/:id que SI valida ownership del paquete.
   */
  @Get('drivers/:driverId/location')
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
