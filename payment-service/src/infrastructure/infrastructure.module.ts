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
import { DatafastGateway } from './gateways/datafast.gateway';
import { DeunaGateway } from './gateways/deuna.gateway';
import { MongoPaymentRepository } from './persistence/mongo-payment.repository';
import { MongoPayoutRepository } from './persistence/mongo-payout.repository';
import { IPaymentRepository, IPayoutRepository } from '../domain/ports';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Payout, PayoutSchema } from './schemas/payout.schema';

/** Token to select the right gateway at runtime based on currency/method */
export const STRIPE_GATEWAY = 'STRIPE_GATEWAY';
export const MERCADOPAGO_GATEWAY = 'MERCADOPAGO_GATEWAY';
export const DATAFAST_GATEWAY = 'DATAFAST_GATEWAY';
export const DEUNA_GATEWAY = 'DEUNA_GATEWAY';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: TransactionModelSchema.name, schema: TransactionSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Payout.name, schema: PayoutSchema },
    ]),
  ],
  providers: [
    // Transaction repository (domain payment lib)
    {
      provide: ITransactionRepository,
      useClass: MongooseTransactionRepository,
    },
    // Payment repository (service-level)
    {
      provide: IPaymentRepository,
      useClass: MongoPaymentRepository,
    },
    // Payout repository (service-level)
    {
      provide: IPayoutRepository,
      useClass: MongoPayoutRepository,
    },
    MongoPaymentRepository,
    MongoPayoutRepository,
    // Default gateway — Stripe for international transactions
    {
      provide: IPaymentGateway,
      useClass: StripeGateway,
    },
    // Named tokens for selecting gateway by currency/method
    { provide: STRIPE_GATEWAY, useClass: StripeGateway },
    { provide: MERCADOPAGO_GATEWAY, useClass: MercadoPagoGateway },
    { provide: DATAFAST_GATEWAY, useClass: DatafastGateway },
    { provide: DEUNA_GATEWAY, useClass: DeunaGateway },
    MercadoPagoGateway,
    StripeGateway,
    DatafastGateway,
    DeunaGateway,
  ],
  exports: [
    ITransactionRepository,
    IPaymentRepository,
    IPayoutRepository,
    IPaymentGateway,
    STRIPE_GATEWAY,
    MERCADOPAGO_GATEWAY,
    DATAFAST_GATEWAY,
    DEUNA_GATEWAY,
    MercadoPagoGateway,
    StripeGateway,
    DatafastGateway,
    DeunaGateway,
  ],
})
export class InfrastructureModule {}
