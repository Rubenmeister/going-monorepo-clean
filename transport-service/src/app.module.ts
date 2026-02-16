import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '@going-monorepo-clean/shared-domain';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TransportController } from './api/transport.controller';
import {
  RequestTripUseCase,
  AcceptTripUseCase,
  GetActiveTripByUserUseCase,
} from '@going-monorepo-clean/domains-transport-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.TRANSPORT_DB_URL),
    InfrastructureModule,
  ],
  controllers: [
    TransportController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    RequestTripUseCase,
    AcceptTripUseCase,
    GetActiveTripByUserUseCase,
  ],
})
export class AppModule {}