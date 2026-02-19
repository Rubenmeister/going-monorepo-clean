import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ITrackingRepository,
  ITrackingGateway,
  IGeoLocationRepository,
  IDriverAvailabilityRepository,
  ITrackingSessionRepository,
  GeolocationService,
  DistanceCalculatorService,
} from '@going/shared-infrastructure';
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
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: configService.get('REDIS_URL'), // .env
        }),
      }),
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