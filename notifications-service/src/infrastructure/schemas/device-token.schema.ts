import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceTokenDocument = Document & DeviceToken;

@Schema({ timestamps: true, collection: 'device_tokens' })
export class DeviceToken {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true, enum: ['android', 'ios', 'web'], default: 'android' })
  platform: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  deviceId?: string;

  @Prop()
  appVersion?: string;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

// Compound index: fast lookup by userId + isActive
DeviceTokenSchema.index({ userId: 1, isActive: 1 });
