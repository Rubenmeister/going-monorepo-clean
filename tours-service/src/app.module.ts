import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '@going-monorepo-clean/shared-domain';
import { InfrastructureModule } from './infrastructure/persistence/schemas/infrastructure.module';
import { TourController } from './api/tour.controller';
import {
  CreateTourUseCase,
} from '@going-monorepo-clean/domains-tour-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.TOURS_DB_URL),
    InfrastructureModule,
  ],
  controllers: [TourController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    CreateTourUseCase,
  ],
})
export class AppModule {}