import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RideDocument = Document & Ride;

@Schema({ timestamps: true, collection: 'rides' })
export class Ride {
  @Prop({ required: true, unique: true })
  rideId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ index: true })
  driverId?: string;

  @Prop({
    required: true,
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  pickupLocation: {
    type: string;
    coordinates: [number, number];
  };

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
  })
  dropoffLocation: {
    type: string;
    coordinates: [number, number];
  };

  @Prop({
    required: true,
    type: {
      baseFare: Number,
      perKmFare: Number,
      perMinuteFare: Number,
      surgeMultiplier: { type: Number, default: 1.0 },
      estimatedTotal: Number,
    },
  })
  fare: {
    baseFare: number;
    perKmFare: number;
    perMinuteFare: number;
    surgeMultiplier: number;
    estimatedTotal: number;
  };

  @Prop()
  finalFare?: number;

  @Prop({
    type: String,
    enum: [
      'requested',
      'accepted',
      'arriving',
      'started',
      'completed',
      'cancelled',
    ],
    default: 'requested',
    index: true,
  })
  status: string;

  @Prop({ type: Date, default: Date.now })
  requestedAt: Date;

  @Prop()
  acceptedAt?: Date;

  @Prop()
  arrivedAt?: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  durationSeconds?: number;

  @Prop()
  distanceKm?: number;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancellationTime?: Date;

  @Prop({ type: Date, default: () => new Date(Date.now() + 86400000) }) // 24h TTL
  expiresAt: Date;
}

export const RideSchema = SchemaFactory.createForClass(Ride);

// Create indexes for queries
RideSchema.index({ userId: 1, createdAt: -1 });
RideSchema.index({ driverId: 1, createdAt: -1 });
RideSchema.index({ status: 1 });
RideSchema.index({ pickupLocation: '2dsphere' });
RideSchema.index({ dropoffLocation: '2dsphere' });
RideSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
