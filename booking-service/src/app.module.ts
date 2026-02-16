import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from 'nestjs-pino';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  JwtAuthGuard,
  RolesGuard,
  AuditLogInterceptor,
  HttpExceptionFilter,
  CorrelationIdInterceptor,
  pinoLoggerConfig,
  IEventBus,
  InMemoryEventBus,
} from '@going-monorepo-clean/shared-domain';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { BookingController } from './api/booking.controller';
import { SagaController } from './api/saga.controller';
import { HealthController } from './api/health.controller';
import { BookingPaymentSaga } from './saga/booking-payment.saga';
import {
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
  GetBookingByIdUseCase,
  ConfirmBookingUseCase,
  CancelBookingUseCase,
  CompleteBookingUseCase,
} from '@going-monorepo-clean/domains-booking-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.BOOKING_DB_URL),
    TerminusModule,
    LoggerModule.forRoot(pinoLoggerConfig),
    EventEmitterModule.forRoot(),
    InfrastructureModule,
  ],
  controllers: [
    BookingController,
    SagaController,
    HealthController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: IEventBus, useClass: InMemoryEventBus },
    BookingPaymentSaga,
    CreateBookingUseCase,
    FindBookingsByUserUseCase,
    GetBookingByIdUseCase,
    ConfirmBookingUseCase,
    CancelBookingUseCase,
    CompleteBookingUseCase,
  ],
})
export class AppModule {}
