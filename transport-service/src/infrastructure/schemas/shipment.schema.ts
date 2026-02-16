import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class LocationEmbeddedSchema {
  @Prop({ required: true })
  address: string;
  @Prop()
  city: string;
  @Prop()
  country: string;
  @Prop({ required: true })
  latitude: number;
  @Prop({ required: true })
  longitude: number;
}

@Schema({ _id: false })
class MoneySchema {
  @Prop({ required: true })
  amount: number;
  @Prop({ required: true })
  currency: string;
}

export type ShipmentDocument = ShipmentModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class ShipmentModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ index: true })
  recipientId?: string;

  @Prop({ required: true })
  recipientName: string;

  @Prop({ required: true })
  recipientPhone: string;

  @Prop({ required: true, type: LocationEmbeddedSchema })
  origin: LocationEmbeddedSchema;

  @Prop({ required: true, type: LocationEmbeddedSchema })
  destination: LocationEmbeddedSchema;

  @Prop({ index: true })
  vehicleId?: string;

  @Prop()
  scheduleId?: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  weightKg: number;

  @Prop({ required: true, type: MoneySchema })
  price: MoneySchema;

  @Prop({ required: true, enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'returned'] })
  status: string;

  @Prop()
  createdAt: Date;

  @Prop()
  pickedUpAt?: Date;

  @Prop()
  deliveredAt?: Date;
}

export const ShipmentSchema = SchemaFactory.createForClass(ShipmentModelSchema);
