import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TrackingController } from './api/tracking.controller';
import { TrackingGateway } from './api/tracking.gateway';
import {
  UpdateLocationUseCase,
  GetActiveDriversUseCase,
} from '@going-monorepo-clean/domains-tracking-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InfrastructureModule,
  ],
  controllers: [
    TrackingController,
  ],
  providers: [
    TrackingGateway, 
    UpdateLocationUseCase,
    GetActiveDriversUseCase,
  ],
})
export class AppModule {}