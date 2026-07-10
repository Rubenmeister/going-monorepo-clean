import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Result, ok, err } from 'neverthrow';
import {
  DriverLocation,
  ITrackingRepository,
} from '@going-monorepo-clean/domains-tracking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { RedisPoolService } from '@going-monorepo-clean/shared-infrastructure';

const DRIVER_KEY_PREFIX = 'driver:location:';
const ACTIVE_DRIVERS_SET = 'drivers:active';

@Injectable()
export class RedisTrackingRepository implements ITrackingRepository {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly redisPoolService: RedisPoolService
  ) {}

  /** Cliente node-redis subyacente del store (cache-manager-redis-yet lo expone como `.client`). */
  private get redisClient(): any {
    return (this.cache.store as any).client;
  }

  async save(location: DriverLocation): Promise<Result<void, Error>> {
    try {
      const key = `${DRIVER_KEY_PREFIX}${location.driverId}`;
      const primitives = location.toPrimitives();

      // Use optimized TTL from pool service (in milliseconds)
      const ttlSeconds = this.redisPoolService.getTTL('driverLocation');
      const ttlMs = ttlSeconds * 1000;

      await this.cache.set(key, primitives, ttlMs);

      const redisClient = this.redisClient;
      await redisClient.sAdd(ACTIVE_DRIVERS_SET, location.driverId);

      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByDriverId(
    driverId: UUID
  ): Promise<Result<DriverLocation | null, Error>> {
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
      const redisClient = this.redisClient;
      const driverIds = await redisClient.sMembers(ACTIVE_DRIVERS_SET);

      if (!driverIds || driverIds.length === 0) {
        return ok([]);
      }

      const keys = driverIds.map((id) => `${DRIVER_KEY_PREFIX}${id}`);
      const results = await this.redisClient.mGet(keys);

      // Poda self-healing (auditoría Bloque 2 #11): la clave driver:location:<id>
      // expira por TTL pero el id nunca se quitaba de ACTIVE_DRIVERS_SET → el set
      // crecía sin límite y degradaba este endpoint. Aquí quitamos del set los
      // ids cuya clave ya expiró (mGet devolvió null).
      const stale: string[] = [];
      const locations: DriverLocation[] = [];
      results.forEach((loc, i) => {
        if (loc) {
          locations.push(
            DriverLocation.fromPrimitives(JSON.parse(loc as string))
          );
        } else {
          stale.push(driverIds[i]);
        }
      });
      if (stale.length > 0) {
        // best-effort; no bloquear la respuesta si falla
        redisClient.sRem(ACTIVE_DRIVERS_SET, stale).catch(() => undefined);
      }

      return ok(locations);
    } catch (error) {
      return err(new Error(error.message));
    }
  }
}
