/**
 * Location Schema - MongoDB
 * Stores real-time and historical driver locations with geospatial indexing
 */

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'locations',
  timestamps: true,
  indexes: [
    { driverId: 1, createdAt: -1 }, // Get latest locations for a driver
    { companyId: 1, createdAt: -1 }, // Get company-wide locations
    { vehicleId: 1, createdAt: -1 }, // Track vehicle movement
    { 'coordinates.coordinates': '2dsphere' }, // Geospatial queries (find nearby)
    { timestamp: 1, expireAfterSeconds: 7776000 }, // Auto-delete after 90 days
  ],
})
export class LocationSchema extends Document {
  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  vehicleId: string;

  @Prop({
    required: true,
    type: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
  })
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({
    type: {
      accuracy: Number, // GPS accuracy in meters
      speed: Number, // Speed in km/h
      heading: Number, // Direction 0-360
      altitude: Number, // Altitude in meters
      provider: String, // 'gps', 'network', 'fused'
    },
  })
  metadata: {
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    provider?: string;
  };

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  zipCode?: string;

  @Prop()
  country?: string;

  @Prop({ required: true, default: () => new Date() })
  timestamp: Date;

  @Prop({ default: () => new Date() })
  createdAt?: Date;

  @Prop({ default: () => new Date() })
  updatedAt?: Date;
}

export const LocationSchemaDefinition =
  SchemaFactory.createForClass(LocationSchema);

// Enable geospatial queries
LocationSchemaDefinition.index({ 'coordinates.coordinates': '2dsphere' });

// TTL index: automatically delete locations older than 90 days
LocationSchemaDefinition.index(
  { timestamp: 1 },
  { expireAfterSeconds: 7776000 }
);
