import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Result, ok, err } from 'neverthrow';
import {
  DriverLocation,
  ITrackingRepository,
} from '@going-monorepo-clean/domains-tracking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

const DRIVER_KEY_PREFIX = 'driver:location:';
const ACTIVE_DRIVERS_SET = 'drivers:active';
const KEY_TTL_SECONDS = 60 * 1000; // 60 segundos en milisegundos

@Injectable()
export class RedisTrackingRepository implements ITrackingRepository {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async save(location: DriverLocation): Promise<Result<void, Error>> {
    try {
      const key = `${DRIVER_KEY_PREFIX}${location.driverId}`;
      const primitives = location.toPrimitives();
      
      await this.cache.set(key, primitives, KEY_TTL_SECONDS);
      
      const redisClient = this.cache.store.getClient();
      await redisClient.sAdd(ACTIVE_DRIVERS_SET, location.driverId);
      
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByDriverId(driverId: UUID): Promise<Result<DriverLocation | null, Error>> {
    try {
      const key = `${DRIVER_KEY_PREFIX}${driverId}`;
      const primitives = await this.cache.get<any>(key);
      return ok(primitives ? DriverLocation.fromPrimitives(primitives) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findAllActive(): Promise<Result<DriverLocation[], Error>> {
    try {
      const redisClient = this.cache.store.getClient();
      const driverIds = await redisClient.sMembers(ACTIVE_DRIVERS_SET);

      if (!driverIds || driverIds.length === 0) {
        return ok([]);
      }

      const keys = driverIds.map(id => `${DRIVER_KEY_PREFIX}${id}`);
      const results = await this.cache.store.mGet(keys);

      const locations = results
        .filter(res => !!res)
        .map(loc => DriverLocation.fromPrimitives(JSON.parse(loc as string)));
        
      return ok(locations);
    } catch (error) {
      return err(new Error(error.message));
    }
  }
}