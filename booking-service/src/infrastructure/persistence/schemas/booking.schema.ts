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
    enum: ['transport', 'accommodation', 'tour', 'experience'],
  })
  serviceType: ServiceType;

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
