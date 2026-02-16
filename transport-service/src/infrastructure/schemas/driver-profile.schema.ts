import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

export type DriverProfileDocument = DriverProfileModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class DriverProfileModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  whatsappNumber: string;

  @Prop({ type: [DocumentUploadSchema], default: [] })
  documents: DocumentUploadSchema[];

  @Prop({ required: true, default: 5.0 })
  rating: number;

  @Prop({ required: true, default: 0 })
  totalTrips: number;

  @Prop({ required: true, enum: ['pending_verification', 'active', 'suspended', 'rejected'] })
  status: string;

  @Prop()
  createdAt: Date;

  @Prop()
  verifiedAt?: Date;
}

export const DriverProfileSchema = SchemaFactory.createForClass(DriverProfileModelSchema);
