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
import { InfrastructureModule } from './infrastructure/persistence/infrastructure.module';
import { ExperienceController } from './api/experience.controller';
import { HealthController } from './api/health.controller';
import {
  CreateExperienceUseCase,
  GetExperienceByIdUseCase,
  SearchExperiencesUseCase,
} from '@going-monorepo-clean/domains-experience-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.EXPERIENCE_DB_URL),
    TerminusModule,
    LoggerModule.forRoot(pinoLoggerConfig),
    InfrastructureModule,
  ],
  controllers: [
    ExperienceController,
    HealthController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    CreateExperienceUseCase,
    GetExperienceByIdUseCase,
    SearchExperiencesUseCase,
  ],
})
export class AppModule {}
