import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationChannelType } from '@going-monorepo-clean/domains-notification-core';

@Schema({ timestamps: true, _id: false })
export class NotificationModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, enum: Object.values(NotificationChannelType) })
  channel: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ required: true, enum: ['PENDING', 'SENT', 'FAILED', 'READ'] })
  status: string;

  @Prop()
  createdAt: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  readAt?: Date;
}

export type NotificationDocument = NotificationModelSchema & Document;
export const NotificationSchema = SchemaFactory.createForClass(NotificationModelSchema);