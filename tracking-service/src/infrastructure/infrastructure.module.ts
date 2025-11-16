import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ITrackingRepository,
  ITrackingGateway,
} from '@going-monorepo-clean/domains-tracking-core';
import { RedisTrackingRepository } from './persistence/redis-tracking.repository';
import { SocketIoTrackingGateway } from './gateways/socket-io-tracking.gateway';

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
    SocketIoTrackingGateway, 
  ],
  exports: [
    ITrackingRepository,
    ITrackingGateway,
  ],
})
export class InfrastructureModule {}