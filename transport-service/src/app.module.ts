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
import { TransportController } from './api/transport.controller';
import { VehicleController } from './api/vehicle.controller';
import { RouteController } from './api/route.controller';
import { ShipmentController } from './api/shipment.controller';
import { RideRequestController } from './api/ride-request.controller';
import { DriverProfileController } from './api/driver-profile.controller';
import { TransportSagaController } from './api/saga.controller';
import { HealthController } from './api/health.controller';
import { TransportPaymentSaga } from './saga/transport-payment.saga';
import {
  RequestTripUseCase,
  AcceptTripUseCase,
  GetActiveTripByUserUseCase,
  GetTripByIdUseCase,
  CancelTripUseCase,
  StartTripUseCase,
  CompleteTripUseCase,
  GetTripsByUserUseCase,
  RegisterVehicleUseCase,
  CreateRouteUseCase,
  CreateScheduleUseCase,
  CreateShipmentUseCase,
  CreateRideRequestUseCase,
  AssignVehicleUseCase,
  RegisterDriverProfileUseCase,
} from '@going-monorepo-clean/domains-transport-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.TRANSPORT_DB_URL),
    TerminusModule,
    LoggerModule.forRoot(pinoLoggerConfig),
    InfrastructureModule,
  ],
  controllers: [
    TransportController,
    VehicleController,
    RouteController,
    ShipmentController,
    RideRequestController,
    DriverProfileController,
    TransportSagaController,
    HealthController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    RequestTripUseCase,
    AcceptTripUseCase,
    GetActiveTripByUserUseCase,
    GetTripByIdUseCase,
    CancelTripUseCase,
    StartTripUseCase,
    CompleteTripUseCase,
    GetTripsByUserUseCase,
    RegisterVehicleUseCase,
    CreateRouteUseCase,
    CreateScheduleUseCase,
    CreateShipmentUseCase,
    CreateRideRequestUseCase,
    AssignVehicleUseCase,
    RegisterDriverProfileUseCase,
    TransportPaymentSaga,
  ],
})
export class AppModule {}
