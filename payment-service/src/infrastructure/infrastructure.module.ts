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
      provide: IPaymentGateway,
      useClass: StripeGateway,
    },
  ],
  exports: [
    ITransactionRepository,
    IPaymentGateway,
  ],
})
export class InfrastructureModule {}