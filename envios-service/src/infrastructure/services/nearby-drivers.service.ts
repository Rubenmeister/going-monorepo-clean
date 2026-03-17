import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const DRIVERS_GEO_KEY = 'going:drivers:locations';
const DRIVER_AVAILABILITY_PREFIX = 'going:driver_availability:';

@Injectable()
export class NearbyDriversService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NearbyDriversService.name);
  private redis: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redis = new Redis(url);
    this.redis.on('error', (e) =>
      this.logger.warn(`Redis error: ${e.message}`)
    );
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  /**
   * Find nearby online drivers using Redis GEO.
   * Reuses the same key populated by the tracking-service.
   */
  async findNearbyOnlineDrivers(
    latitude: number,
    longitude: number,
    radiusKm = 10,
    maxResults = 10
  ): Promise<string[]> {
    try {
      // georadius returns [[member, distance], ...] with WITHCOORD/WITHDIST
      // Using basic form: GEORADIUS key lng lat radius unit COUNT max ASC
      const results = await (this.redis as any).georadius(
        DRIVERS_GEO_KEY,
        longitude,
        latitude,
        radiusKm,
        'km',
        'COUNT',
        maxResults,
        'ASC'
      ) as string[];

      if (!results || results.length === 0) return [];

      // Filter by online status
      const onlineDrivers: string[] = [];
      for (const driverId of results) {
        const availability = await this.redis.hget(
          `${DRIVER_AVAILABILITY_PREFIX}${driverId}`,
          'status'
        );
        if (availability === 'online') {
          onlineDrivers.push(driverId);
        }
      }

      return onlineDrivers;
    } catch (e) {
      this.logger.warn(`Redis GEO query failed: ${e.message}`);
      return [];
    }
  }
}
