import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

@Schema({ _id: false })
class DriverInfoSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0, max: 5 })
  rating: number;

  @Prop({ required: true, min: 0, max: 1 })
  acceptanceRate: number;

  @Prop({ required: true })
  vehicleType: string;

  @Prop()
  vehicleNumber?: string;

  @Prop()
  photoUrl?: string;
}

export type RideMatchDocument = RideMatchModelSchema & Document;

@Schema({ timestamps: false })
export class RideMatchModelSchema {
  @Prop({ required: true, unique: true, index: true })
  id: string;

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
    index: true,
  })
  acceptanceStatus: MatchStatus;

  @Prop({ type: DriverInfoSchema, required: true })
  driverInfo: DriverInfoSchema;

  @Prop({ required: true, index: true })
  createdAt: Date;

  @Prop({ required: true, index: true, expireAfterSeconds: 0 }) // TTL: 2 minutes
  expiresAt: Date;

  @Prop()
  acceptedAt?: Date;

  @Prop()
  rejectedAt?: Date;
}

export const RideMatchSchema =
  SchemaFactory.createForClass(RideMatchModelSchema);

// Create indexes for optimal query performance
RideMatchSchema.index({ rideId: 1, createdAt: -1 });
RideMatchSchema.index({
  driverId: 1,
  acceptanceStatus: 1,
});
RideMatchSchema.index({ matchId: 1 }, { unique: true });

// TTL index for automatic deletion after 2 minutes
RideMatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
