import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  IDriverLocationRepository,
  DriverLocation,
} from '@going-monorepo-clean/domains-tracking-core';

@Injectable()
export class InMemoryDriverLocationRepository implements IDriverLocationRepository {
  private readonly store = new Map<string, DriverLocation>();

  async save(location: DriverLocation): Promise<Result<void, Error>> {
    this.store.set(location.driverId, location);
    return ok(undefined);
  }

  async findByDriverId(driverId: string): Promise<Result<DriverLocation | null, Error>> {
    const location = this.store.get(driverId);
    return ok(location || null);
  }
}
