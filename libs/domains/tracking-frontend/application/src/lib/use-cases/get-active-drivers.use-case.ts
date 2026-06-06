import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { IDriverLocationRepository, DriverLocation } from '@going-monorepo-clean/domains-tracking-frontend-core';

export interface DriverLocationViewModel {
  driverId: string;
  latitude: number;
  longitude: number;
  updatedAt: Date;
}

@Injectable()
export class GetActiveDriversUseCase {
  constructor(
    @Inject(IDriverLocationRepository)
    private readonly repository: IDriverLocationRepository,
  ) {}

  async execute(): Promise<Result<DriverLocationViewModel[], Error>> {
    const result = await this.repository.getActiveDrivers();

    if (result.isErr()) return err(result.error);

    const viewModels: DriverLocationViewModel[] = result.value.map((d) => ({
      driverId: d.driverId,
      latitude: d.latitude,
      longitude: d.longitude,
      updatedAt: d.updatedAt,
    }));

    return ok(viewModels);
  }
}
