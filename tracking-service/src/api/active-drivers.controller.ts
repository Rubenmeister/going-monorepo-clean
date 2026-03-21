import { Controller, Get, Inject } from '@nestjs/common';
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
}
