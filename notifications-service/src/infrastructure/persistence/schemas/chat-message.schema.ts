import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class ChatMessageModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  tripId: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ required: true })
  senderRole: string;

  @Prop({ required: true, index: true })
  recipientId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: 'SENT' })
  status: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop()
  readAt?: Date;
}

export type ChatMessageDocument = HydratedDocument<ChatMessageModelSchema>;

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessageModelSchema);

// Index for fetching trip chat history
ChatMessageSchema.index({ tripId: 1, createdAt: 1 });
// Index for unread messages per recipient
ChatMessageSchema.index({ recipientId: 1, status: 1 });
