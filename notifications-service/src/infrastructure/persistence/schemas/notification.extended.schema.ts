import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';
export type NotificationType =
  | 'RIDE_MATCH'
  | 'MESSAGE'
  | 'STATUS_UPDATE'
  | 'RATE_REMINDER'
  | 'ALERT';

@Schema({ _id: false })
class DeviceTokenSchema {
  @Prop({ required: true, type: String, enum: ['ios', 'android', 'web'] })
  platform: 'ios' | 'android' | 'web';

  @Prop({ required: true, index: true })
  token: string;

  @Prop({ required: true, default: true })
  isValid: boolean;

  @Prop()
  lastSentAt?: Date;
}

@Schema({ _id: false })
class NotificationDataSchema {
  @Prop()
  rideId?: string;

  @Prop()
  driverId?: string;

  @Prop()
  actionUrl?: string;

  @Prop()
  customData?: Record<string, any>;
}

export type NotificationDocument = NotificationExtendedModelSchema & Document;

@Schema({ timestamps: true })
export class NotificationExtendedModelSchema {
  @Prop({ required: true, unique: true, index: true })
  notificationId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    required: true,
    type: String,
    enum: ['RIDE_MATCH', 'MESSAGE', 'STATUS_UPDATE', 'RATE_REMINDER', 'ALERT'],
    index: true,
  })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: NotificationDataSchema })
  data?: NotificationDataSchema;

  @Prop({ type: [DeviceTokenSchema], default: [] })
  deviceTokens: DeviceTokenSchema[];

  @Prop({
    required: true,
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'READ'],
    index: true,
  })
  status: NotificationStatus;

  @Prop()
  sentAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop({ required: true, default: 0 })
  retries: number;

  @Prop({ required: true, index: true })
  createdAt: Date;

  @Prop({ index: true, expireAfterSeconds: 0 }) // 7 days TTL
  expiresAt?: Date;
}

export const NotificationExtendedSchema = SchemaFactory.createForClass(
  NotificationExtendedModelSchema
);

// Create indexes for optimal query performance
NotificationExtendedSchema.index({ userId: 1, createdAt: -1 });
NotificationExtendedSchema.index({ notificationId: 1 }, { unique: true });
NotificationExtendedSchema.index({ status: 1 });
NotificationExtendedSchema.index({ type: 1 });
NotificationExtendedSchema.index({ userId: 1, status: 1 });

// TTL index for automatic deletion after 7 days
NotificationExtendedSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for device token lookups
NotificationExtendedSchema.index({
  'deviceTokens.token': 1,
  'deviceTokens.isValid': 1,
});
