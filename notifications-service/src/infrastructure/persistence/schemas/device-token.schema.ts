import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DevicePlatform = 'ios' | 'android' | 'web';
export type TokenStatus = 'ACTIVE' | 'INACTIVE' | 'INVALID';

export type DeviceTokenDocument = DeviceTokenModelSchema & Document;

@Schema({ timestamps: true })
export class DeviceTokenModelSchema {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    required: true,
    type: String,
    enum: ['ios', 'android', 'web'],
    index: true,
  })
  platform: DevicePlatform;

  @Prop({ required: true, index: true })
  token: string;

  @Prop({
    required: true,
    type: String,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'INVALID'],
  })
  status: TokenStatus;

  @Prop()
  deviceName?: string; // e.g., "iPhone 14 Pro"

  @Prop()
  osVersion?: string; // e.g., "17.2"

  @Prop()
  appVersion?: string; // e.g., "1.0.5"

  @Prop({ required: true, index: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  disabledReason?: string; // Reason why token was disabled
}

export const DeviceTokenSchema = SchemaFactory.createForClass(
  DeviceTokenModelSchema
);

// Create indexes for optimal query performance
DeviceTokenSchema.index({ userId: 1, platform: 1 });
DeviceTokenSchema.index({ userId: 1, status: 1 });
DeviceTokenSchema.index({ token: 1 }, { unique: true });
DeviceTokenSchema.index({ status: 1 });
DeviceTokenSchema.index({ createdAt: 1 });
DeviceTokenSchema.index({ lastUsedAt: 1 });

// Alias for backward compatibility with @InjectModel(DeviceToken.name)
export const DeviceToken = DeviceTokenModelSchema;
