import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  TourCategory,
  TourStatus,
} from '@going-monorepo-clean/domains-tour-core';

@Schema({ _id: false })
class LocationSchema {
  @Prop({ required: true })
  address: string;
  @Prop({ required: true })
  city: string;
  @Prop({ required: true })
  country: string;
  @Prop({ required: true })
  latitude: number;
  @Prop({ required: true })
  longitude: number;
}

@Schema({ _id: false })
class MoneySchema {
  @Prop({ required: true })
  amount: number;
  @Prop({ required: true })
  currency: string;
}

export type TourDocument = TourModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class TourModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  hostId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: LocationSchema })
  location: LocationSchema;

  @Prop({ required: true, type: MoneySchema })
  price: MoneySchema;

  @Prop({ required: true })
  durationHours: number;

  @Prop({ required: true })
  maxGuests: number;

  @Prop({ required: true, enum: Object.values(TourCategory) })
  category: TourCategory;

  @Prop({ required: true, enum: ['draft', 'published', 'archived'] })
  status: TourStatus;

  @Prop()
  createdAt: Date;
}

export const TourSchema = SchemaFactory.createForClass(TourModelSchema);
TourSchema.index({ 'location.city': 1 });
TourSchema.index({ 'price.amount': 1 });
TourSchema.index({ category: 1 });