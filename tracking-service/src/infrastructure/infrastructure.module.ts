import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisPoolService } from '@going-monorepo-clean/shared-infrastructure';
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

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService, RedisPoolService],
      useFactory: async (
        configService: ConfigService,
        redisPoolService: RedisPoolService
      ) => {
        const storeOptions = redisPoolService.getStoreOptions();
        return {
          store: await redisStore({
            url: configService.get('REDIS_URL'),
            // Connection pool settings
            maxRetriesPerRequest: storeOptions.maxRetriesPerRequest,
            enableReadyCheck: storeOptions.enableReadyCheck,
            enableOfflineQueue: storeOptions.enableOfflineQueue,
            connectTimeout: storeOptions.connectTimeout,
            retryStrategy: storeOptions.retryStrategy,
            keepAlive: storeOptions.keepAliveInterval,
            lazyConnect: storeOptions.lazyConnect,
          }),
        };
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
