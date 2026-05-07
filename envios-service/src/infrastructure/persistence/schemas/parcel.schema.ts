import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParcelStatus } from '@going-monorepo-clean/domains-parcel-core';

@Schema({ _id: false })
class MoneySchema {
  @Prop({ required: true })
  amount: number;
  @Prop({ required: true })
  currency: string;
}

@Schema({ _id: false })
class LocationSchema {
  @Prop({ required: true })
  address: string;
  @Prop({ required: true })
  latitude: number;
  @Prop({ required: true })
  longitude: number;
}

export type ParcelDocument = ParcelModelSchema & Document;

// Nota: NO usar _id: false aquí — eso es solo para sub-documents.
// En documentos top-level, Mongoose siempre necesita un _id; con _id:false
// el save() falla con "document must have an _id before saving".
// Dejamos que Mongoose auto-genere ObjectId como _id, y mantenemos `id`
// como UUID separado (campo de aplicación) — `findOne({ id })` sigue
// funcionando porque hay índice único en `id`.
@Schema({ timestamps: true })
export class ParcelModelSchema {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ index: true })
  driverId?: string;

  @Prop({ required: true, type: LocationSchema })
  origin: LocationSchema;

  @Prop({ required: true, type: LocationSchema })
  destination: LocationSchema;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: MoneySchema })
  price: MoneySchema;

  @Prop({
    required: true,
    type: String,
    enum: [
      'pending',
      'pending_payment',
      'pending_recipient_payment',
      'pickup_assigned',
      'in_transit',
      'delivered',
      'cancelled',
    ],
  })
  status: ParcelStatus;

  @Prop({ required: true, index: true })
  trackingCode: string;

  @Prop({ required: true })
  otpPin: string;

  @Prop()
  createdAt: Date;

  // ── Payment fields ──────────────────────────────────────────────────────────
  @Prop({ type: String, enum: ['card', 'cash'] })
  paymentMethod?: string;

  @Prop({ type: String, enum: ['sender', 'recipient'] })
  payerRole?: string;

  @Prop({
    type: String,
    enum: ['pending', 'pending_payment', 'paid', 'paid_at_pickup', 'paid_at_delivery', 'failed'],
  })
  paymentStatus?: string;

  @Prop({ index: true })
  paymentIntentId?: string;

  @Prop()
  paymentLinkUrl?: string;

  @Prop()
  recipientPhone?: string;

  @Prop()
  recipientName?: string;

  @Prop()
  cashConfirmedAt?: Date;

  @Prop()
  cashConfirmedBy?: string;

  // OTP rate-limit (anti brute-force, OTP es 4 dígitos = 10K combos)
  @Prop({ default: 0 })
  otpAttempts?: number;

  @Prop()
  otpLockedUntil?: Date;
}

export const ParcelSchema = SchemaFactory.createForClass(ParcelModelSchema);
