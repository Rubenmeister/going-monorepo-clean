import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TrackingSessionSchema = Document & TrackingSessionDocument;

@Schema({ timestamps: true, collection: 'tracking_sessions' })
export class TrackingSessionDocument {
  @Prop({ required: true, unique: true })
  tripId: string;

  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    type: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
  })
  startLocation: {
    type: string;
    coordinates: [number, number];
  };

  @Prop({
    type: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
  })
  endLocation?: {
    type: string;
    coordinates: [number, number];
  };

  @Prop({
    type: [
      {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: [Number],
        accuracy: Number,
        timestamp: Date,
      },
    ],
    default: [],
  })
  route: Array<{
    type: string;
    coordinates: [number, number];
    accuracy?: number;
    timestamp?: Date;
  }>;

  @Prop({
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ type: Date, default: () => new Date(Date.now() + 3600000) }) // TTL 1 hour
  expiresAt: Date;
}

export const TrackingSessionSchema = SchemaFactory.createForClass(
  TrackingSessionDocument
);

// Create GeoJSON index for location queries
TrackingSessionSchema.index({ startLocation: '2dsphere' });
TrackingSessionSchema.index({ endLocation: '2dsphere' });
TrackingSessionSchema.index({ route: '2dsphere' });

// TTL index - auto-delete old sessions
TrackingSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
