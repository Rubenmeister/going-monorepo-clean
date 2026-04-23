import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'blockchain_trip_records' })
export class TripRecordSchema extends Document {
  @Prop({ required: true, unique: true, index: true })
  rideId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  driverId: string;

  @Prop({ required: true })
  fromAddress: string;

  @Prop({ required: true })
  toAddress: string;

  @Prop()
  distanceKm?: number;

  @Prop()
  durationSeconds?: number;

  @Prop()
  fare?: number;

  @Prop()
  paymentMethod?: string;

  @Prop()
  completedAt?: Date;

  @Prop({ required: true })
  hash: string;

  @Prop()
  blockHash?: string;

  @Prop({ default: 'pending' })
  status: string;
}

export const TripRecordSchemaDefinition = SchemaFactory.createForClass(TripRecordSchema);
