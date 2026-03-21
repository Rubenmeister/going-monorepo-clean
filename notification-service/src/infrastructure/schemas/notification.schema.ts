/**
 * Notification Schema - MongoDB
 * Stores notification records with status tracking and delivery history
 */

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

interface RelatedEntity {
  type: string;
  id: string;
}

interface NotificationData {
  [key: string]: any;
}

@Schema({
  collection: 'notifications',
  timestamps: true,
  indexes: [
    { userId: 1, companyId: 1, createdAt: -1 },
    { companyId: 1, status: 1, createdAt: -1 },
    { userId: 1, status: 1, readAt: 1 },
    { type: 1, companyId: 1, createdAt: -1 },
    { 'relatedEntity.type': 1, 'relatedEntity.id': 1 },
    { expiresAt: 1 }, // TTL index
    { status: 1, sentAt: 1 },
  ],
})
export class NotificationSchema extends Document {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    required: true,
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
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  description?: string;

  @Prop()
  icon?: string;

  @Prop()
  image?: string;

  @Prop({ required: true, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  priority: string;

  @Prop({
    type: [String],
    enum: ['PUSH', 'EMAIL', 'SMS', 'IN_APP'],
    required: true,
  })
  channels: string[];

  @Prop({
    required: true,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED'],
  })
  status: string;

  @Prop({ type: Object })
  relatedEntity?: RelatedEntity;

  @Prop()
  actionUrl?: string;

  @Prop()
  actionLabel?: string;

  @Prop({ type: Object })
  data?: NotificationData;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop({ default: 0 })
  deliveryAttempts: number;

  @Prop({ default: 3 })
  maxDeliveryAttempts: number;

  @Prop()
  expiresAt?: Date;
}

export const NotificationSchemaDefinition =
  SchemaFactory.createForClass(NotificationSchema);

// Set TTL index to auto-delete old notifications after 90 days
NotificationSchemaDefinition.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for user's unread notifications
NotificationSchemaDefinition.index(
  { userId: 1, companyId: 1, status: 1 },
  { name: 'user_unread_notifications' }
);
