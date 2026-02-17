import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  ITrackingRepository,
  ITrackingGateway,
  ILocationHistoryRepository,
} from '@going-monorepo-clean/domains-tracking-core';
import { IEventBus, InMemoryEventBus } from '@going-monorepo-clean/shared-domain';
import { RedisTrackingRepository } from './persistence/redis-tracking.repository';
import { SocketIoTrackingGateway } from './gateways/socket-io-tracking.gateway';
import { MongooseLocationHistoryRepository } from './persistence/mongoose-location-history.repository';
import {
  LocationHistoryModelSchema,
  LocationHistorySchema,
} from './persistence/schemas/location-history.schema';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: configService.get('REDIS_URL'),
        }),
      }),
      isGlobal: true,
    }),
    MongooseModule.forFeature([
      { name: LocationHistoryModelSchema.name, schema: LocationHistorySchema },
    ]),
    EventEmitterModule.forRoot(),
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
      provide: ILocationHistoryRepository,
      useClass: MongooseLocationHistoryRepository,
    },
    {
      provide: IEventBus,
      useClass: InMemoryEventBus,
    },
    SocketIoTrackingGateway,
  ],
  exports: [
    ITrackingRepository,
    ITrackingGateway,
    ILocationHistoryRepository,
    IEventBus,
  ],
})
export class InfrastructureModule {}