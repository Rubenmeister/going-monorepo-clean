import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './api/health.controller';
import { BridgeController } from './api/bridge.controller';
import { CloudRunJobsClient } from './infrastructure/cloud-run-jobs.client';
import { HttpServiceClient } from './infrastructure/http-service.client';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [
    HealthController,
    BridgeController,
  ],
  providers: [
    CloudRunJobsClient,
    HttpServiceClient,
  ],
})
export class AppModule {}
