import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DriverProfileDocument = Document & DriverProfile;

@Schema({ timestamps: true, collection: 'driver_profiles' })
export class DriverProfile {
  @Prop({ required: true, unique: true, index: true })
  driverId: string;

  @Prop({ required: true, default: 5.0, min: 0, max: 5 })
  averageRating: number;

  @Prop({ required: true, default: 0 })
  totalRatings: number;

  @Prop({ required: true, default: 0 })
  completedTrips: number;

  @Prop({ required: true, default: 0 })
  cancelledTrips: number;

  @Prop({ required: true, default: 100, min: 0, max: 100 })
  acceptanceRate: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  cancellationRate: number;

  @Prop({ required: true, default: 100, min: 0, max: 100 })
  onTimeDeliveryRate: number;

  @Prop({ required: true, default: 0 })
  totalEarnings: number;

  @Prop({ required: true, default: 0 })
  averageEarningsPerTrip: number;

  @Prop()
  lastRated?: Date;

  @Prop({
    type: [String],
    default: [],
    enum: ['super_driver', 'highly_rated', 'veteran_driver'],
  })
  badges: string[];

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const DriverProfileSchema = SchemaFactory.createForClass(DriverProfile);

// Create indexes
DriverProfileSchema.index({ averageRating: -1 });
DriverProfileSchema.index({ totalRatings: -1 });
DriverProfileSchema.index({ badges: 1 });
DriverProfileSchema.index({ completedTrips: -1 });
