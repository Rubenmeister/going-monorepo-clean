import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard, AuditLogInterceptor } from '@going-monorepo-clean/shared-domain';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ParcelController } from './api/parcel.controller';
import {
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
} from '@going-monorepo-clean/domains-parcel-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.PARCEL_DB_URL),
    InfrastructureModule,
  ],
  controllers: [
    ParcelController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    CreateParcelUseCase,
    FindParcelsByUserUseCase,
  ],
})
export class AppModule {}