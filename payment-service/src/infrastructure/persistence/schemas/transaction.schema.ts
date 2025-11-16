import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TransactionStatus } from '@going-monorepo-clean/domains-payment-core';

@Schema({ _id: false })
class MoneySchema {
  @Prop({ required: true })
  amount: number;
  @Prop({ required: true })
  currency: string;
}

@Schema({ timestamps: true, _id: false })
export class TransactionModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  referenceId: string;

  @Prop({ index: true })
  paymentIntentId?: string;

  @Prop({ required: true, type: MoneySchema })
  amount: MoneySchema;

  @Prop({ required: true, enum: ['pending', 'succeeded', 'failed'] })
  status: TransactionStatus;

  @Prop()
  createdAt: Date;
}

export type TransactionDocument = TransactionModelSchema & Document;
export const TransactionSchema = SchemaFactory.createForClass(TransactionModelSchema);

