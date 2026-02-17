import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
class LocationEmbeddedSchema {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

@Schema({ timestamps: true })
export class LocationHistoryModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ index: true })
  tripId?: string;

  @Prop({ type: LocationEmbeddedSchema, required: true })
  location: LocationEmbeddedSchema;

  @Prop()
  speed?: number;

  @Prop()
  heading?: number;

  @Prop()
  accuracy?: number;

  @Prop({ required: true, index: true })
  recordedAt: Date;
}

export type LocationHistoryDocument = HydratedDocument<LocationHistoryModelSchema>;

export const LocationHistorySchema = SchemaFactory.createForClass(LocationHistoryModelSchema);

// Compound index for efficient time-range queries per driver
LocationHistorySchema.index({ driverId: 1, recordedAt: -1 });
// Compound index for trip route queries
LocationHistorySchema.index({ tripId: 1, recordedAt: 1 });
