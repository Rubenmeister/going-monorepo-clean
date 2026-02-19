import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RideAnalyticsDocument = Document & RideAnalytics;

@Schema({ timestamps: true, collection: 'ride_analytics' })
export class RideAnalytics {
  @Prop({ required: true, unique: true, index: true })
  date: Date;

  @Prop({ required: true, default: 0 })
  totalRides: number;

  @Prop({ required: true, default: 0 })
  completedRides: number;

  @Prop({ required: true, default: 0 })
  cancelledRides: number;

  @Prop({ required: true, default: 0 })
  totalDistance: number;

  @Prop({ required: true, default: 0 })
  totalDuration: number;

  @Prop({ required: true, default: 0 })
  totalRevenue: number;

  @Prop({ required: true, default: 0 })
  platformRevenue: number;

  @Prop({ required: true, default: 0 })
  driverEarnings: number;

  @Prop({ type: Map, of: Number, default: {} })
  peakHourRides: Map<number, number>;

  @Prop({
    type: {
      completed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      noShow: { type: Number, default: 0 },
    },
    default: { completed: 0, cancelled: 0, noShow: 0 },
  })
  ridesByStatus: {
    completed: number;
    cancelled: number;
    noShow: number;
  };

  @Prop({ type: Map, of: Number, default: {} })
  cancellationRateByReason: Map<string, number>;

  @Prop({
    type: [
      {
        from: String,
        to: String,
        count: Number,
        averageFare: Number,
      },
    ],
    default: [],
  })
  topRoutes: Array<{
    from: string;
    to: string;
    count: number;
    averageFare: number;
  }>;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;
}

export const RideAnalyticsSchema = SchemaFactory.createForClass(RideAnalytics);

// Create indexes
RideAnalyticsSchema.index({ date: -1 });
RideAnalyticsSchema.index({ totalRevenue: -1 });
RideAnalyticsSchema.index({ totalRides: -1 });
