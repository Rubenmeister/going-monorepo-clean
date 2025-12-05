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

@Schema({ timestamps: true, _id: false })
export class ParcelModelSchema {
  @Prop({ required: true, unique: true })
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

  @Prop({ required: true, enum: ['pending', 'pickup_assigned', 'in_transit', 'delivered', 'cancelled'] })
  status: ParcelStatus;

  @Prop()
  createdAt: Date;
}

export const ParcelSchema = SchemaFactory.createForClass(ParcelModelSchema);