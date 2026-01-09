import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Result, ok, err } from 'neverthrow';
import {
  DriverLocation,
  IDriverLocationRepository,
} from '@going-monorepo-clean/domains-tracking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

const DRIVER_KEY_PREFIX = 'driver:location:';
const ACTIVE_DRIVERS_SET = 'drivers:active';
const KEY_TTL_SECONDS = 60 * 1000; // 60 segundos en milisegundos

@Injectable()
export class RedisTrackingRepository implements IDriverLocationRepository {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async save(location: DriverLocation): Promise<Result<void, Error>> {
    try {
      const key = `${DRIVER_KEY_PREFIX}${location.driverId}`;
      const primitives = location.toPrimitives();
      
      await this.cache.set(key, primitives, KEY_TTL_SECONDS);
      
      // Get the underlying redis client if possible
      const redisStore = (this.cache as any).store;
      const redisClient = redisStore.client || (redisStore.getClient ? redisStore.getClient() : null);
      
      if (redisClient && redisClient.sAdd) {
        await redisClient.sAdd(ACTIVE_DRIVERS_SET, location.driverId);
      } else if (redisClient && redisClient.sadd) {
        await redisClient.sadd(ACTIVE_DRIVERS_SET, location.driverId);
      }
      
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
      const redisStore = (this.cache as any).store;
      const redisClient = redisStore.client || (redisStore.getClient ? redisStore.getClient() : null);
      
      let driverIds: string[] = [];
      if (redisClient && redisClient.sMembers) {
        driverIds = await redisClient.sMembers(ACTIVE_DRIVERS_SET);
      } else if (redisClient && redisClient.smembers) {
        driverIds = await redisClient.smembers(ACTIVE_DRIVERS_SET);
      } else {
        // Fallback for non-redis stores or unknown clients
        return ok([]);
      }

      if (!driverIds || driverIds.length === 0) {
        return ok([]);
      }

      const keys = driverIds.map(id => `${DRIVER_KEY_PREFIX}${id}`);
      
      // Try mget/mGet from store first
      let results: any[] = [];
      if (redisStore.mget) {
        results = await redisStore.mget(...keys);
      } else if (redisStore.mGet) {
        results = await redisStore.mGet(...keys);
      } else if (redisClient && (redisClient.mGet || redisClient.mget)) {
        const mgetFn = redisClient.mGet || redisClient.mget;
        results = await mgetFn.call(redisClient, keys);
      } else {
        // Fallback to individual gets
        results = await Promise.all(keys.map(k => this.cache.get(k)));
      }

      const locations = results
        .filter(res => !!res)
        .map(loc => {
          const data = typeof loc === 'string' ? JSON.parse(loc) : loc;
          return DriverLocation.fromPrimitives(data);
        });
        
      return ok(locations);
    } catch (error) {
      return err(new Error(error.message));
    }
  }
}