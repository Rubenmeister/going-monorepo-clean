/**
 * Notification Preferences Schema - MongoDB
 * Stores user notification preferences and settings
 */

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'notification-preferences',
  timestamps: true,
})
export class NotificationPreferencesSchema extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ default: true })
  enablePush: boolean;

  @Prop({ default: true })
  enableEmail: boolean;

  @Prop({ default: false })
  enableSms: boolean;

  @Prop({ default: true })
  enableInApp: boolean;

  @Prop()
  quietHoursStart?: string; // HH:mm format

  @Prop()
  quietHoursEnd?: string; // HH:mm format

  @Prop({ default: false })
  quietHoursEnabled: boolean;

  @Prop({ default: false })
  doNotDisturb: boolean;

  @Prop({
    type: [String],
    enum: [
      'INVOICE_ISSUED',
      'INVOICE_PAYMENT_REMINDER',
      'INVOICE_OVERDUE',
      'INVOICE_PAID',
      'LOCATION_ALERT',
      'GEOFENCE_ENTRY',
      'GEOFENCE_EXIT',
      'DRIVER_ASSIGNMENT',
      'TRIP_STARTED',
      'TRIP_COMPLETED',
      'SYSTEM_ALERT',
      'DELIVERY_UPDATE',
      'PAYMENT_CONFIRMATION',
    ],
    default: [],
  })
  unsubscribedTypes: string[];

  @Prop({
    type: [String],
    enum: ['PUSH', 'EMAIL', 'SMS', 'IN_APP'],
    default: [],
  })
  unsubscribedChannels: string[];

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;
}

export const NotificationPreferencesSchemaDefinition =
  SchemaFactory.createForClass(NotificationPreferencesSchema);

// Unique constraint on userId and companyId
NotificationPreferencesSchemaDefinition.index(
  { userId: 1, companyId: 1 },
  { unique: true }
);
