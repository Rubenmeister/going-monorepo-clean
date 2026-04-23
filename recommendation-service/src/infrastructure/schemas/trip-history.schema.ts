import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'trip_history' })
export class TripHistorySchema extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  fromAddress: string;

  @Prop()
  fromLat?: number;

  @Prop()
  fromLng?: number;

  @Prop({ required: true })
  toAddress: string;

  @Prop()
  toLat?: number;

  @Prop()
  toLng?: number;

  @Prop({ default: 1 })
  count: number;

  @Prop()
  lastTripAt?: Date;

  @Prop()
  rideId?: string;
}

export const TripHistorySchemaDefinition = SchemaFactory.createForClass(TripHistorySchema);
TripHistorySchemaDefinition.index({ userId: 1, toAddress: 1 }, { unique: true });
