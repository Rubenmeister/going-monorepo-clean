import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Document & Payment;

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ required: true, unique: true, index: true })
  paymentId: string;

  @Prop({ required: true, index: true })
  tripId: string;

  @Prop({ required: true, index: true })
  passengerId: string;

  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 0 })
  platformFee: number;

  @Prop({ required: true, default: 0 })
  driverAmount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({
    required: true,
    enum: ['card', 'wallet', 'cash'],
    index: true,
  })
  paymentMethod: string;

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    index: true,
  })
  status: string;

  @Prop()
  transactionId?: string;

  @Prop({ required: true, default: 0 })
  serviceCharge: number;

  @Prop({ required: true, default: 0 })
  tax: number;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop({ type: Map, of: String })
  metadata?: Map<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Single field indexes
PaymentSchema.index({ tripId: 1 });
PaymentSchema.index({ paymentMethod: 1 });

// Compound indexes for common queries
PaymentSchema.index({ passengerId: 1, createdAt: -1 });
PaymentSchema.index({ driverId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ passengerId: 1, status: 1 });
PaymentSchema.index({ driverId: 1, status: 1 });
PaymentSchema.index({ status: 1, paymentMethod: 1 });
PaymentSchema.index({ createdAt: 1, status: 1, driverId: 1 }); // For revenue reports
PaymentSchema.index({ amount: -1 });
PaymentSchema.index({ completedAt: -1 }); // For completed payments queries
