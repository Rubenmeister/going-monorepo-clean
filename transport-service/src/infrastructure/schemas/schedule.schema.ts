import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScheduleDocument = ScheduleModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class ScheduleModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  routeId: string;

  @Prop({ required: true, index: true })
  vehicleId: string;

  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true, enum: ['PASSENGER', 'DELIVERY', 'MIXED'] })
  serviceType: string;

  @Prop({ required: true })
  departureTime: string;

  @Prop({ required: true })
  arrivalTime: string;

  @Prop({ type: [String], required: true })
  days: string[];

  @Prop({ required: true })
  effectiveFrom: Date;

  @Prop()
  effectiveUntil?: Date;

  @Prop({ required: true, enum: ['active', 'inactive', 'cancelled'] })
  status: string;

  @Prop()
  createdAt: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(ScheduleModelSchema);
