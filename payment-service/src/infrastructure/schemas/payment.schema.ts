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
    // auditoría B1: faltaban corporate/datafast/deuna — el código los usa (7/16/11
    // ocurrencias) y mongoose valida el enum al crear → el Payment de esos métodos
    // NO persistía (en corporate el error lo tragaba el try/catch de transport →
    // payout del conductor sin registrar). Bug latente hasta que se ejerzan.
    enum: ['card', 'wallet', 'cash', 'corporate', 'datafast', 'deuna'],
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
// (tripId y paymentMethod ya tienen índice vía @Prop({ index: true }); no se
//  redeclaran aquí para no disparar el warning de índice duplicado de Mongoose.)

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

// Idempotencia por viaje (auditoría B1 #6/#7): a lo sumo UN pago activo por tripId.
// Cierra el TOCTOU de complete-ride bajo multi-pod (dos cierres concurrentes del
// mismo viaje ya no crean dos Payment). Parcial: excluye 'failed' para permitir
// reintento legítimo tras un pago fallido.
PaymentSchema.index(
  { tripId: 1 },
  {
    unique: true,
    name: 'tripId_unique_active',
    partialFilterExpression: {
      status: { $in: ['pending', 'processing', 'completed', 'refunded'] },
    },
  },
);
