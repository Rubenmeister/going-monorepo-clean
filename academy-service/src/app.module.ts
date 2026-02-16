import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard, AuditLogInterceptor } from '@going-monorepo-clean/shared-domain';
import { InfrastructureModule } from './infrastructure/persistence/schemas/infrastructure.module';
import { AcademyController } from './api/academy.controller';
import {
  CreateCourseUseCase,
  GetCourseByIdUseCase,
  SearchCoursesUseCase,
  PublishCourseUseCase,
} from '@going-monorepo-clean/domains-academy-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.ACADEMY_DB_URL),
    InfrastructureModule,
  ],
  controllers: [AcademyController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    CreateCourseUseCase,
    GetCourseByIdUseCase,
    SearchCoursesUseCase,
    PublishCourseUseCase,
  ],
})
export class AppModule {}
