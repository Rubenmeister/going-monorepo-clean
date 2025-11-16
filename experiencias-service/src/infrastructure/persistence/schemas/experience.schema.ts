import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ExperienceStatus } from '@going-monorepo-clean/domains-experience-core';

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

export type ExperienceDocument = ExperienceModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class ExperienceModelSchema {
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

  @Prop({ required: true, enum: ['draft', 'published', 'archived'] })
  status: ExperienceStatus;

  @Prop()
  createdAt: Date;
}

export const ExperienceSchema = SchemaFactory.createForClass(ExperienceModelSchema);
ExperienceSchema.index({ 'location.city': 1 });