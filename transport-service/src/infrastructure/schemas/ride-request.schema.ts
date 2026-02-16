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

export type RideRequestDocument = RideRequestModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class RideRequestModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  passengerId: string;

  @Prop({ required: true, type: LocationEmbeddedSchema })
  origin: LocationEmbeddedSchema;

  @Prop({ required: true, type: LocationEmbeddedSchema })
  destination: LocationEmbeddedSchema;

  @Prop({ required: true })
  vehicleTypePreference: string;

  @Prop({ required: true, enum: ['PRIVATE', 'SHARED'] })
  rideType: string;

  @Prop({ required: true, enum: ['FRONT', 'BACK'] })
  seatPreference: string;

  @Prop({ required: true })
  passengersCount: number;

  @Prop({ required: true, type: MoneySchema })
  basePrice: MoneySchema;

  @Prop({ required: true, type: MoneySchema })
  seatPremium: MoneySchema;

  @Prop({ required: true, type: MoneySchema })
  totalPrice: MoneySchema;

  @Prop({ index: true })
  assignedVehicleId?: string;

  @Prop({ index: true })
  assignedDriverId?: string;

  @Prop()
  assignedSeatNumber?: number;

  @Prop({ required: true, enum: ['pending', 'searching', 'assigned', 'driver_en_route', 'passenger_picked_up', 'in_progress', 'completed', 'cancelled', 'no_driver_found'] })
  status: string;

  @Prop({ required: true })
  requestedAt: Date;

  @Prop()
  assignedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop({ required: true, index: true })
  priority: number;
}

export const RideRequestSchema = SchemaFactory.createForClass(RideRequestModelSchema);
