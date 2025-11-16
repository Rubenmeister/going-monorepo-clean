import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PaymentController } from './api/payment.controller';
import { WebhookController } from './api/webhook.controller';
import {
  CreatePaymentIntentUseCase,
  HandleStripeEventUseCase,
} from '@going-monorepo-clean/domains-payment-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.PAYMENT_DB_URL), // .env
    InfrastructureModule,
  ],
  controllers: [
    PaymentController,
    WebhookController,
  ],
  providers: [
    CreatePaymentIntentUseCase,
    HandleStripeEventUseCase,
  ],
})
export class AppModule {}