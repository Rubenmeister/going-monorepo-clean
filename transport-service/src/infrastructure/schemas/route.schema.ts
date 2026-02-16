import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class LocationEmbeddedSchema {
  @Prop({ required: true })
  address: string;
  @Prop()
  city: string;
  @Prop()
  country: string;
  @Prop({ required: true })
  latitude: number;
  @Prop({ required: true })
  longitude: number;
}

@Schema({ _id: false })
class RouteStopSchema {
  @Prop({ required: true })
  order: number;
  @Prop({ required: true, type: LocationEmbeddedSchema })
  location: LocationEmbeddedSchema;
  @Prop({ required: true })
  estimatedArrivalMinutes: number;
}

export type RouteDocument = RouteModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class RouteModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: LocationEmbeddedSchema })
  origin: LocationEmbeddedSchema;

  @Prop({ required: true, type: LocationEmbeddedSchema })
  destination: LocationEmbeddedSchema;

  @Prop({ type: [RouteStopSchema], default: [] })
  stops: RouteStopSchema[];

  @Prop({ required: true })
  distanceKm: number;

  @Prop({ required: true })
  estimatedDurationMinutes: number;

  @Prop({ required: true, enum: ['active', 'inactive'] })
  status: string;

  @Prop()
  createdAt: Date;
}

export const RouteSchema = SchemaFactory.createForClass(RouteModelSchema);
