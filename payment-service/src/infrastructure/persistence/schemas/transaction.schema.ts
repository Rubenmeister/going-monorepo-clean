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

/**
 * OJO: sin `_id: false`. Ese flag corresponde a SUBdocumentos; en una colección
 * de nivel superior impide que Mongoose genere el _id y todo save() falla con
 * "document must have an _id before saving". Mismo defecto que tenían reservas
 * y notificaciones (copy-paste desde un subdocumento).
 */
@Schema({ timestamps: true })
export class TransactionModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  referenceId: string;

  @Prop({ index: true })
  paymentIntentId?: string;

  @Prop({ index: true })
  idempotencyKey?: string;

  @Prop()
  clientSecret?: string;

  @Prop({ required: true, type: MoneySchema })
  amount: MoneySchema;

  @Prop({
    required: true,
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
  })
  status: TransactionStatus;

  @Prop()
  createdAt: Date;
}

export type TransactionDocument = TransactionModelSchema & Document;
export const TransactionSchema = SchemaFactory.createForClass(
  TransactionModelSchema
);
