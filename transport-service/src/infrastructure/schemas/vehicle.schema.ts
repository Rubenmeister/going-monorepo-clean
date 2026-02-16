import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class SeatSchema {
  @Prop({ required: true })
  seatNumber: number;
  @Prop({ required: true })
  position: string;
  @Prop()
  passengerId?: string;
  @Prop({ required: true })
  occupied: boolean;
}

@Schema({ _id: false })
class DocumentUploadSchema {
  @Prop({ required: true })
  type: string;
  @Prop({ required: true })
  url: string;
  @Prop({ required: true })
  mimeType: string;
  @Prop({ required: true })
  status: string;
  @Prop()
  uploadedAt: Date;
  @Prop()
  reviewedAt?: Date;
  @Prop()
  expiresAt?: Date;
  @Prop()
  rejectionReason?: string;
}

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

export type VehicleDocument = VehicleModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class VehicleModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true, index: true })
  type: string;

  @Prop({ required: true, unique: true })
  plate: string;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  color: string;

  @Prop({ type: [SeatSchema], required: true })
  seats: SeatSchema[];

  @Prop({ type: [DocumentUploadSchema], default: [] })
  documents: DocumentUploadSchema[];

  @Prop({ required: true })
  hasDashcam: boolean;

  @Prop({ required: true, enum: ['pending_approval', 'active', 'inactive', 'suspended', 'in_transit'] })
  status: string;

  @Prop({ type: LocationEmbeddedSchema })
  currentLocation?: LocationEmbeddedSchema;

  @Prop()
  createdAt: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(VehicleModelSchema);
