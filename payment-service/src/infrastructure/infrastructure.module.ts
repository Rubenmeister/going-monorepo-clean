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
import { DatafastGateway } from './gateways/datafast.gateway';
import { DeunaGateway } from './gateways/deuna.gateway';
import { MongoPaymentRepository } from './persistence/mongo-payment.repository';
import { MongoPayoutRepository } from './persistence/mongo-payout.repository';
import { IPaymentRepository, IPayoutRepository } from '../domain/ports';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Payout, PayoutSchema } from './schemas/payout.schema';

/**
 * Token to select the right gateway at runtime based on currency/method.
 *
 * Going opera con DOS pasarelas (decisión de Rubén, 19-jul-2026): Datafast
 * (adquirente de tarjeta) y DeUna (billetera/transferencia). Stripe se eliminó
 * porque no opera en Ecuador y MercadoPago porque no se va a usar.
 */
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
    // Pasarela por defecto — Datafast, el adquirente de tarjeta en Ecuador.
    {
      provide: IPaymentGateway,
      useClass: DatafastGateway,
    },
    // Named tokens for selecting gateway by currency/method
    { provide: DATAFAST_GATEWAY, useClass: DatafastGateway },
    { provide: DEUNA_GATEWAY, useClass: DeunaGateway },
    DatafastGateway,
    DeunaGateway,
  ],
  exports: [
    ITransactionRepository,
    IPaymentRepository,
    IPayoutRepository,
    IPaymentGateway,
    DATAFAST_GATEWAY,
    DEUNA_GATEWAY,
    DatafastGateway,
    DeunaGateway,
  ],
})
export class InfrastructureModule {}
