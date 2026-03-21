import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PayoutDocument = Document & Payout;

@Schema({ timestamps: true, collection: 'payouts' })
export class Payout {
  @Prop({ required: true, unique: true, index: true })
  payoutId: string;

  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    index: true,
  })
  status: string;

  @Prop({
    required: true,
    enum: ['bank_account', 'debit_card', 'wallet'],
  })
  paymentMethod: string;

  @Prop({ required: true, index: true })
  periodStart: Date;

  @Prop({ required: true, index: true })
  periodEnd: Date;

  @Prop({ required: true, default: 0 })
  transactionCount: number;

  @Prop({
    type: [String],
    default: [],
  })
  transactionIds: string[];

  @Prop({ required: true, default: 0 })
  fees: number;

  @Prop({ required: true, default: 0 })
  netAmount: number;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop()
  processedAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop({ type: Map, of: String })
  metadata?: Map<string, any>;
}

export const PayoutSchema = SchemaFactory.createForClass(Payout);

// Create indexes for efficient queries
PayoutSchema.index({ driverId: 1, createdAt: -1 });
PayoutSchema.index({ status: 1, createdAt: -1 });
PayoutSchema.index({ driverId: 1, periodStart: 1, periodEnd: 1 });
PayoutSchema.index({ amount: -1 });
