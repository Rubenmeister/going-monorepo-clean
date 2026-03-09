import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ITransactionRepository,
  IPaymentGateway,
} from '@going-monorepo-clean/domains-payment-core';
import { MongooseTransactionRepository } from './persistence/mongoose-transaction.repository';
import {
  TransactionModelSchema,
  TransactionSchema,
} from './persistence/schemas/transaction.schema';
import { StripeGateway } from './gateways/stripe.gateway';
import { MercadoPagoGateway } from './gateways/mercadopago.gateway';

/** Token to select the right gateway at runtime based on currency */
export const STRIPE_GATEWAY = 'STRIPE_GATEWAY';
export const MERCADOPAGO_GATEWAY = 'MERCADOPAGO_GATEWAY';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: TransactionModelSchema.name, schema: TransactionSchema },
    ]),
  ],
  providers: [
    {
      provide: ITransactionRepository,
      useClass: MongooseTransactionRepository,
    },
    {
      // Default gateway — Stripe for international transactions
      provide: IPaymentGateway,
      useClass: StripeGateway,
    },
    // Named tokens for selecting gateway by currency in the application layer
    { provide: STRIPE_GATEWAY, useClass: StripeGateway },
    { provide: MERCADOPAGO_GATEWAY, useClass: MercadoPagoGateway },
    MercadoPagoGateway,
    StripeGateway,
  ],
  exports: [
    ITransactionRepository,
    IPaymentGateway,
    STRIPE_GATEWAY,
    MERCADOPAGO_GATEWAY,
    MercadoPagoGateway,
    StripeGateway,
  ],
})
export class InfrastructureModule {}
