import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Redis } from 'ioredis';
import {
  ITrackingRepository,
  ITrackingGateway,
  IGeoLocationRepository,
  IDriverAvailabilityRepository,
  ITrackingSessionRepository,
  GeolocationService,
  DistanceCalculatorService,
} from '../domain/ports';
import { RedisTrackingRepository } from './persistence/redis-tracking.repository';
import { RedisGeoRepository } from './persistence/redis-geo.repository';
import { RedisAvailabilityRepository } from './persistence/redis-availability.repository';
import { MongoTrackingRepository } from './persistence/mongo-tracking.repository';
import { SocketIoTrackingGateway } from './gateways/socket-io-tracking.gateway';
import {
  TrackingSessionDocument,
  TrackingSessionSchema,
} from './schemas/tracking-session.schema';
import { RedisPoolService } from '@going-monorepo-clean/shared-infrastructure';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl =
          configService.get('REDIS_URL') || 'redis://localhost:6379';
        try {
          const store = await redisStore({
            url: redisUrl,
            lazyConnect: true,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 0,
            connectTimeout: 3000,
          });
          return { store };
        } catch (e) {
          console.warn(
            `[Cache] Redis unavailable (${redisUrl}), using memory store:`,
            (e as Error).message
          );
          return {}; // falls back to default in-memory store
        }
      },
      isGlobal: true,
    }),
    MongooseModule.forFeature([
      {
        name: 'TrackingSession',
        schema: TrackingSessionSchema,
      },
    ]),
  ],
  providers: [
    {
      provide: Redis,
      useFactory: (configService: ConfigService) => {
        const url = configService.get('REDIS_URL') || 'redis://localhost:6379';
        return new Redis(url, {
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 0,
          connectTimeout: 3000,
        });
      },
      inject: [ConfigService],
    },
    RedisPoolService,
    {
      provide: ITrackingRepository,
      useClass: RedisTrackingRepository,
    },
    {
      provide: ITrackingGateway,
      useClass: SocketIoTrackingGateway,
    },
    {
      provide: 'IGeoLocationRepository',
      useClass: RedisGeoRepository,
    },
    {
      provide: 'IDriverAvailabilityRepository',
      useClass: RedisAvailabilityRepository,
    },
    {
      provide: 'ITrackingSessionRepository',
      useClass: MongoTrackingRepository,
    },
    {
      provide: 'GeolocationService',
      useFactory: (
        geoRepo: IGeoLocationRepository,
        availRepo: IDriverAvailabilityRepository,
        distanceCalc: DistanceCalculatorService
      ) => new GeolocationService(geoRepo, availRepo, distanceCalc),
      inject: [
        'IGeoLocationRepository',
        'IDriverAvailabilityRepository',
        DistanceCalculatorService,
      ],
    },
    DistanceCalculatorService,
    SocketIoTrackingGateway,
  ],
  exports: [
    ITrackingRepository,
    ITrackingGateway,
    'IGeoLocationRepository',
    'IDriverAvailabilityRepository',
    'ITrackingSessionRepository',
    'GeolocationService',
    DistanceCalculatorService,
  ],
})
export class InfrastructureModule {}
