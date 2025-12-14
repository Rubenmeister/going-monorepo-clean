import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ObservabilityModule } from '@going/shared/observability';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PaymentController } from './api/payment.controller';
import { WebhookController } from './api/webhook.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule.forRoot({ serviceName: 'payment-service' }),
    InfrastructureModule,
  ],
  controllers: [PaymentController, WebhookController],
  providers: [],
})
export class AppModule {}