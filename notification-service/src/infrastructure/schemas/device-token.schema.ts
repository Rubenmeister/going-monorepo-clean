/**
 * Device Token Schema - MongoDB
 * Stores Firebase Cloud Messaging tokens for push notifications
 */

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'device-tokens',
  timestamps: true,
  indexes: [
    { userId: 1, companyId: 1 },
    { fcmToken: 1, isActive: 1 },
    { userId: 1, isActive: 1 },
    { expiresAt: 1 }, // TTL index
    { createdAt: -1 },
  ],
})
export class DeviceTokenSchema extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, unique: true, sparse: true })
  fcmToken: string;

  @Prop({ required: true, enum: ['iOS', 'Android', 'Web'] })
  deviceType: string;

  @Prop()
  deviceName?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: () => new Date() })
  lastUsedAt: Date;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  lastErrorAt?: Date;

  @Prop()
  lastErrorMessage?: string;

  @Prop({ default: 0 })
  failureCount: number;
}

export const DeviceTokenSchemaDefinition =
  SchemaFactory.createForClass(DeviceTokenSchema);

// Set TTL index to auto-delete expired tokens
DeviceTokenSchemaDefinition.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for looking up user's active devices
DeviceTokenSchemaDefinition.index(
  { userId: 1, companyId: 1, isActive: 1 },
  { name: 'user_active_devices' }
);
