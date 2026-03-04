import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';
export type MessageType = 'TEXT' | 'IMAGE' | 'MEDIA' | 'SYSTEM';

@Schema({ _id: false })
class MessageAttachmentSchema {
  @Prop({ required: true, type: String, enum: ['image', 'file'] })
  type: 'image' | 'file';

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  uploadedAt: Date;
}

@Schema({ _id: false })
class ReadReceiptSchema {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  readAt: Date;
}

export type MessageDocument = MessageModelSchema & Document;

@Schema({ timestamps: true })
export class MessageModelSchema {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  rideId: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ required: true, index: true })
  receiverId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [MessageAttachmentSchema], default: [] })
  attachments: MessageAttachmentSchema[];

  @Prop({ type: [ReadReceiptSchema], default: [] })
  readReceipts: ReadReceiptSchema[];

  @Prop({
    required: true,
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
    index: true,
  })
  status: MessageStatus;

  @Prop({
    required: true,
    type: String,
    enum: ['TEXT', 'IMAGE', 'MEDIA', 'SYSTEM'],
    default: 'TEXT',
  })
  messageType: MessageType;

  @Prop()
  relatedTo?: string;

  @Prop({ required: true, index: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop({ index: true, expireAfterSeconds: 2592000 }) // 30 days TTL
  expiresAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(MessageModelSchema);

// Create indexes for optimal query performance
MessageSchema.index({ rideId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, 'readReceipts.userId': 1 });
MessageSchema.index({ messageId: 1 }, { unique: true });
MessageSchema.index({ status: 1 });

// TTL index for automatic deletion after 30 days
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
