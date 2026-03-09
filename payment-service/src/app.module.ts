import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PaymentController } from './api/payment.controller';
import { HealthController } from './api/health.controller';
import { WebhookController } from './api/webhook.controller';
import {
  CreatePaymentIntentUseCase,
  HandleStripeEventUseCase,
} from '@going-monorepo-clean/domains-payment-application';
import { PricingService } from './application/pricing.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.PAYMENT_DB_URL, {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }), // .env
    InfrastructureModule,
  ],
  controllers: [PaymentController, WebhookController, HealthController],
  providers: [
    CreatePaymentIntentUseCase,
    HandleStripeEventUseCase,
    PricingService,
  ],
})
export class AppModule {}
