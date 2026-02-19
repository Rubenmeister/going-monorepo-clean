import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DriverAnalyticsDocument = Document & DriverAnalytics;

@Schema({ timestamps: true, collection: 'driver_analytics' })
export class DriverAnalytics {
  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    index: true,
  })
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @Prop({ required: true, index: true })
  date: Date;

  // Activity metrics
  @Prop({ required: true, default: 0 })
  ridesCompleted: number;

  @Prop({ required: true, default: 0 })
  ridesCancelled: number;

  @Prop({ required: true, default: 0 })
  hoursOnline: number;

  @Prop({ required: true, default: 0 })
  averageRideDistance: number;

  @Prop({ required: true, default: 0 })
  averageRideDuration: number;

  // Revenue metrics
  @Prop({ required: true, default: 0 })
  totalEarnings: number;

  @Prop({ required: true, default: 0 })
  averageEarningsPerRide: number;

  @Prop({ required: true, default: 0 })
  averageEarningsPerHour: number;

  // Quality metrics
  @Prop({ required: true, default: 5.0, min: 0, max: 5 })
  averageRating: number;

  @Prop({ required: true, default: 0 })
  totalRatings: number;

  @Prop({ required: true, default: 100, min: 0, max: 100 })
  acceptanceRate: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  cancellationRate: number;

  @Prop({ required: true, default: 100, min: 0, max: 100 })
  onTimeDeliveryRate: number;

  // Performance badges
  @Prop({
    type: [String],
    default: [],
    enum: ['super_driver', 'highly_rated', 'veteran_driver'],
  })
  badges: string[];

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;
}

export const DriverAnalyticsSchema = SchemaFactory.createForClass(DriverAnalytics);

// Create indexes for efficient queries
DriverAnalyticsSchema.index({ driverId: 1, period: 1, date: -1 });
DriverAnalyticsSchema.index({ driverId: 1, date: -1 });
DriverAnalyticsSchema.index({ period: 1, date: -1 });
DriverAnalyticsSchema.index({ totalEarnings: -1 });
DriverAnalyticsSchema.index({ averageRating: -1 });
DriverAnalyticsSchema.index({ ridesCompleted: -1 });
