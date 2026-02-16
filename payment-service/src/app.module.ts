import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard, AuditLogInterceptor } from '@going-monorepo-clean/shared-domain';
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
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.PAYMENT_DB_URL),
    InfrastructureModule,
  ],
  controllers: [
    PaymentController,
    WebhookController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    CreatePaymentIntentUseCase,
    HandleStripeEventUseCase,
  ],
})
export class AppModule {}