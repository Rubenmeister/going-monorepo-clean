import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard, AuditLogInterceptor } from '@going-monorepo-clean/shared-domain';
import { InfrastructureModule } from './infrastructure/persistence/infrastructure.module';
import { ExperienceController } from './api/experience.controller';
import {
  CreateExperienceUseCase,
} from '@going-monorepo-clean/domains-experience-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.EXPERIENCE_DB_URL),
    InfrastructureModule,
  ],
  controllers: [ExperienceController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    CreateExperienceUseCase,
  ],
})
export class AppModule {}