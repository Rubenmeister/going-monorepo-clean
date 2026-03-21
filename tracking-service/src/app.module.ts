import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TrackingController } from './api/tracking.controller';
import { HealthController } from './api/health.controller';
import { TrackingGateway } from './api/tracking.gateway';
import { CorporateAuditController } from './api/corporate-audit.controller';
import { CorporateTrackingModule } from './api/corporate-tracking.module';
import {
  UpdateLocationUseCase,
  GetActiveDriversUseCase,
} from '@going-monorepo-clean/domains-tracking-application';
import { CorporateAuthModule } from '@going-monorepo-clean/features-corporate-auth';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InfrastructureModule,
    CorporateAuthModule,
    CorporateTrackingModule,
  ],
  controllers: [TrackingController, CorporateAuditController, HealthController],
  providers: [TrackingGateway, UpdateLocationUseCase, GetActiveDriversUseCase],
})
export class AppModule {}
