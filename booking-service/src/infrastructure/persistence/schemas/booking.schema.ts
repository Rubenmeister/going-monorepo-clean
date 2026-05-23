import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  BookingStatus,
  ServiceType,
} from '@going-monorepo-clean/domains-booking-core'; // Reemplaza con tu scope

// DTO anidado para el 'Money' Value Object
@Schema({ _id: false })
class MoneySchema {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;
}

export type BookingDocument = BookingModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class BookingModelSchema {
  @Prop({ required: true, unique: true })
  id: string; // ID de la entidad de dominio

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  serviceId: string; // ID del Trip, Accommodation, o Tour

  @Prop({
    required: true,
    type: String,
    enum: ['transport', 'accommodation', 'tour', 'experience', 'parcel'],
  })
  serviceType: ServiceType;

  @Prop({
    required: false,
    type: String,
    enum: ['urban', 'intercity'],
  })
  bookingType?: 'urban' | 'intercity';

  @Prop({ required: true, type: MoneySchema })
  totalPrice: MoneySchema;

  @Prop({
    required: true,
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
  })
  status: BookingStatus;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  // ── Contexto corporativo (lo setea corporate-service al crear) ─────────
  @Prop({ index: true })
  companyId?: string;

  @Prop({
    type: String,
    enum: ['b2c', 'corporate'],
    default: 'b2c',
  })
  clientSegment?: 'b2c' | 'corporate';

  @Prop({
    type: String,
    enum: ['immediate', 'corporate_monthly'],
    default: 'immediate',
  })
  paymentMode?: 'immediate' | 'corporate_monthly';
}

export const BookingSchema = SchemaFactory.createForClass(BookingModelSchema);

// Single field indexes
BookingSchema.index({ status: 1 });
BookingSchema.index({ serviceType: 1 });

// Compound indexes for common queries
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ serviceId: 1, serviceType: 1 });
BookingSchema.index({ status: 1, createdAt: -1 });
BookingSchema.index({ userId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ startDate: 1, endDate: 1, status: 1 });

// Index for date range queries
BookingSchema.index({ createdAt: -1 });

// Corporate listings: query principal de corporate-service (stats, factura, etc.).
BookingSchema.index({ companyId: 1, createdAt: -1 });
BookingSchema.index({ companyId: 1, status: 1, createdAt: -1 });
