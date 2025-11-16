import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AccommodationStatus } from '@going-monorepo-clean/domains-accommodation-core';

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

export type AccommodationDocument = AccommodationModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class AccommodationModelSchema {
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
  pricePerNight: MoneySchema;

  @Prop({ required: true })
  capacity: number;

  @Prop([String])
  amenities: string[];

  @Prop({ required: true, enum: ['draft', 'published', 'archived'] })
  status: AccommodationStatus;

  @Prop()
  createdAt: Date;
}

export const AccommodationSchema = SchemaFactory.createForClass(AccommodationModelSchema);
AccommodationSchema.index({ 'location.city': 1 });
AccommodationSchema.index({ 'location.country': 1 });
AccommodationSchema.index({ capacity: 1 });