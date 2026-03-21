import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RideMatchDocument = Document & RideMatch;

export interface DriverInfoSchema {
  name: string;
  rating: number; // 0-5
  acceptanceRate: number; // 0-1
  vehicleType: string;
  vehicleNumber?: string;
  photoUrl?: string;
}

@Schema({ timestamps: true, collection: 'ride_matches' })
export class RideMatch {
  @Prop({ required: true, unique: true })
  matchId: string;

  @Prop({ required: true, index: true })
  rideId: string;

  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true })
  distance: number; // kilometers

  @Prop({ required: true })
  eta: number; // minutes

  @Prop({
    required: true,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
  })
  acceptanceStatus: string;

  @Prop({
    type: {
      name: { type: String, required: true },
      rating: { type: Number, required: true },
      acceptanceRate: { type: Number, required: true },
      vehicleType: { type: String, required: true },
      vehicleNumber: String,
      photoUrl: String,
    },
    required: true,
  })
  driverInfo: DriverInfoSchema;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ required: true, index: true })
  expiresAt: Date; // TTL for auto-expiry

  @Prop()
  acceptedAt?: Date;

  @Prop()
  rejectedAt?: Date;
}

export const RideMatchSchema = SchemaFactory.createForClass(RideMatch);

// Create indexes for performance
RideMatchSchema.index({ rideId: 1, createdAt: -1 });
RideMatchSchema.index({ driverId: 1, acceptanceStatus: 1 });
RideMatchSchema.index({ matchId: 1 }, { unique: true });
RideMatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
