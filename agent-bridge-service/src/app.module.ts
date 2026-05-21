/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Chaski — agent-bridge-service                                       │
 * │  "mensajero del imperio Inca"                                        │
 * │  Adapter stateless. Recibe comandos de Wayra y los rutea al destino: │
 * │  Cloud Run Job (Rumi/Inti/Killa/Sumak/Sacha/Quinde/Kuntur) o HTTP    │
 * │  service (customer-support, cerebro). Sin Mongo, sin decisión.       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
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
