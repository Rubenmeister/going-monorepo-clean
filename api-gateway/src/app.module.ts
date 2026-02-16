import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from 'nestjs-pino';
import {
  HttpExceptionFilter,
  CorrelationIdInterceptor,
  pinoLoggerConfig,
} from '@going-monorepo-clean/shared-domain';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { TrackingModule } from './tracking/tracking.module';
import { HealthController } from './api/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ProxyModule,
    TrackingModule,
    TerminusModule,
    LoggerModule.forRoot(pinoLoggerConfig),
  ],
  controllers: [
    HealthController,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
  ],
})
export class AppModule {}
