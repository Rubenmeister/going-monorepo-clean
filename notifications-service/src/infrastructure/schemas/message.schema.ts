import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Document & Message;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ required: true, unique: true })
  messageId: string;

  @Prop({ required: true, index: true })
  rideId: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ required: true, index: true })
  receiverId: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: [
      {
        type: { type: String, enum: ['image', 'file'] },
        url: String,
        size: Number,
      },
    ],
    default: [],
  })
  attachments: Array<{
    type: 'image' | 'file';
    url: string;
    size: number;
  }>;

  @Prop()
  readAt?: Date;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ type: Date, default: () => new Date(Date.now() + 2592000000) }) // 30 days
  expiresAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Create indexes
MessageSchema.index({ rideId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, readAt: 1 });
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
