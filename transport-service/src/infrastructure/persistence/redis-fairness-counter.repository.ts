import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Result, ok, err } from 'neverthrow';
import {
  IFairnessCounterRepository,
  FairnessKey,
  DriverFairnessSnapshot,
} from '@going-monorepo-clean/domains-transport-core';

const KEY_PREFIX = 'going:fairness:';
const DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 días

/**
 * RedisFairnessCounter — implementación atómica con INCR + EXPIRE.
 *
 * Layout: `going:fairness:<periodKey>:<baseId|none>:<driverId>` → integer
 * con TTL 7d. Al expirar, el contador del periodo desaparece sin
 * intervención manual.
 */
@Injectable()
export class RedisFairnessCounterRepository implements IFairnessCounterRepository {
  private readonly logger = new Logger(RedisFairnessCounterRepository.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private redisKey(k: FairnessKey): string {
    return `${KEY_PREFIX}${k.periodKey}:${k.baseId ?? 'none'}:${k.driverId}`;
  }

  async increment(
    key: FairnessKey,
    ttlSec: number = DEFAULT_TTL,
  ): Promise<Result<number, Error>> {
    try {
      const k = this.redisKey(key);
      // INCR + EXPIRE en una sola round-trip via pipeline.
      const [incr, _expire] = (await this.redis
        .multi()
        .incr(k)
        .expire(k, ttlSec)
        .exec()) as Array<[Error | null, any]>;

      if (incr[0]) return err(incr[0]);
      return ok(Number(incr[1]) || 0);
    } catch (e) {
      this.logger.warn(`increment failed: ${(e as Error).message}`);
      return err(e as Error);
    }
  }

  async get(key: FairnessKey): Promise<Result<number, Error>> {
    try {
      const v = await this.redis.get(this.redisKey(key));
      return ok(v ? parseInt(v, 10) : 0);
    } catch (e) {
      return err(e as Error);
    }
  }

  async getMany(keys: FairnessKey[]): Promise<Result<DriverFairnessSnapshot[], Error>> {
    if (keys.length === 0) return ok([]);
    try {
      const redisKeys = keys.map((k) => this.redisKey(k));
      const values = await this.redis.mget(...redisKeys);
      return ok(
        keys.map((k, i) => ({
          driverId: k.driverId,
          baseId: k.baseId,
          periodKey: k.periodKey,
          count: values[i] ? parseInt(values[i] as string, 10) : 0,
        })),
      );
    } catch (e) {
      this.logger.warn(`getMany failed: ${(e as Error).message}`);
      return err(e as Error);
    }
  }

  async reset(key: FairnessKey): Promise<Result<void, Error>> {
    try {
      await this.redis.del(this.redisKey(key));
      return ok(undefined);
    } catch (e) {
      return err(e as Error);
    }
  }
}
