import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TripStatus } from '@going-monorepo-clean/domains-transport-core';

@Schema({ _id: false })
class MoneySchema {
  @Prop({ required: true })
  amount: number;
  @Prop({ required: true })
  currency: string;
}

@Schema({ _id: false })
class LocationSchema {
  @Prop({ required: true })
  address: string;
  @Prop({ required: true })
  latitude: number;
  @Prop({ required: true })
  longitude: number;
}

export type TripDocument = TripModelSchema & Document;

/**
 * Sin `_id: false`: es una COLECCIÓN, no un subdocumento. Con ese flag Mongoose
 * no genera el _id y todo save() falla con "document must have an _id before
 * saving". Mismo defecto que tenían reservas, notificaciones, pagos y viajes.
 */
@Schema({ timestamps: true })
export class TripModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ index: true })
  driverId?: string;

  @Prop({ required: true, type: LocationSchema })
  origin: LocationSchema;

  @Prop({ required: true, type: LocationSchema })
  destination: LocationSchema;

  @Prop({ required: true, type: MoneySchema })
  price: MoneySchema;

  @Prop({ required: true, enum: ['pending', 'driver_assigned', 'in_progress', 'completed', 'cancelled'] })
  status: TripStatus;

  @Prop()
  createdAt: Date;

  @Prop()
  startedAt?: Date;
  
  @Prop()
  completedAt?: Date;
}

export const TripSchema = SchemaFactory.createForClass(TripModelSchema);