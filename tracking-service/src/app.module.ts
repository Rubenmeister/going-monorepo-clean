import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from 'nestjs-pino';
import {
  JwtAuthGuard,
  RolesGuard,
  AuditLogInterceptor,
  HttpExceptionFilter,
  CorrelationIdInterceptor,
  pinoLoggerConfig,
} from '@going-monorepo-clean/shared-domain';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TrackingController } from './api/tracking.controller';
import { GeolocationController } from './api/geolocation.controller';
import { TrackingGateway } from './api/tracking.gateway';
import { HealthController } from './api/health.controller';
import {
  UpdateLocationUseCase,
  GetActiveDriversUseCase,
  SaveLocationHistoryUseCase,
  GetTripRouteUseCase,
  CheckGeofenceUseCase,
  CalculateEtaUseCase,
  GetDriverLocationForTripUseCase,
  CheckProximityUseCase,
} from '@going-monorepo-clean/domains-tracking-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.TRACKING_DB_URL),
    TerminusModule,
    LoggerModule.forRoot(pinoLoggerConfig),
    InfrastructureModule,
  ],
  controllers: [
    TrackingController,
    GeolocationController,
    HealthController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    TrackingGateway,
    UpdateLocationUseCase,
    GetActiveDriversUseCase,
    SaveLocationHistoryUseCase,
    GetTripRouteUseCase,
    CheckGeofenceUseCase,
    CalculateEtaUseCase,
    GetDriverLocationForTripUseCase,
    CheckProximityUseCase,
  ],
})
export class AppModule {}
