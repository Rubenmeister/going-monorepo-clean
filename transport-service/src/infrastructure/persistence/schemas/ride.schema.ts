import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'rides' })
export class RideModelSchema {
  @Prop({ required: true }) userId: string;
  @Prop() driverId: string;
  @Prop({ type: Object }) pickupLocation: any;
  @Prop({ type: Object }) dropoffLocation: any;
  @Prop({ type: Object }) fare: any;
  @Prop({ type: Object }) finalFare: any;
  @Prop({ default: 'requested' }) status: string;
  @Prop({ default: () => new Date() }) requestedAt: Date;
  @Prop() acceptedAt: Date;
  @Prop() arrivedAt: Date;
  @Prop() startedAt: Date;
  @Prop() completedAt: Date;
  @Prop() durationSeconds: number;
  @Prop() distanceKm: number;
  @Prop() cancellationReason: string;
}

export type RideDocument = RideModelSchema & Document;
export const RideSchema = SchemaFactory.createForClass(RideModelSchema);
