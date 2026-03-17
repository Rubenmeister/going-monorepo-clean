import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PaymentController } from './api/payment.controller';
import { HealthController } from './api/health.controller';
import { WebhookController } from './api/webhook.controller';
import { PaymentOperationsController } from './api/controllers/payment-operations.controller';
import {
  CreatePaymentIntentUseCase,
  HandleStripeEventUseCase,
} from '@going-monorepo-clean/domains-payment-application';
import { PricingService } from './application/pricing.service';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { CompleteRideUseCase } from './application/use-cases/complete-ride.use-case';
import { CreatePayoutUseCase } from './application/use-cases/create-payout.use-case';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.PAYMENT_DB_URL, {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    InfrastructureModule, // exports ITransactionRepository, IPaymentRepository, IPayoutRepository, gateways
  ],
  controllers: [
    PaymentController,          // POST /payments/intent, POST /payments/estimate
    PaymentOperationsController, // POST /payments/process, POST /payments/complete-ride, GET /payments/:id, etc.
    WebhookController,           // POST /webhooks/stripe, POST /webhooks/mercadopago
    HealthController,
  ],
  providers: [
    // Domain lib use cases (use ITransactionRepository + IPaymentGateway from InfrastructureModule)
    CreatePaymentIntentUseCase,
    HandleStripeEventUseCase,
    // Service-level use cases (use IPaymentRepository + IPayoutRepository + StripeGateway)
    PricingService,
    ProcessPaymentUseCase,
    CompleteRideUseCase,
    CreatePayoutUseCase,
  ],
})
export class AppModule {}
