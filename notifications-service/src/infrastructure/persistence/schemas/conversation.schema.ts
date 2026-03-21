import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class LastMessageSchema {
  @Prop({ required: true })
  messageId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  timestamp: Date;
}

@Schema({ _id: false })
class UnreadCountSchema {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, default: 0 })
  count: number;
}

export type ConversationDocument = ConversationModelSchema & Document;

@Schema({ timestamps: true })
export class ConversationModelSchema {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  rideId: string;

  @Prop({ required: true, type: [String], index: true })
  participants: string[];

  @Prop({ type: LastMessageSchema })
  lastMessage?: LastMessageSchema;

  @Prop({ type: [UnreadCountSchema], default: [] })
  unreadCounts: UnreadCountSchema[];

  @Prop({ required: true, index: true })
  createdAt: Date;

  @Prop({ required: true, index: -1 })
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(
  ConversationModelSchema
);

// Create indexes for optimal query performance
ConversationSchema.index({ rideId: 1 });
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index(
  { rideId: 1, participants: 1 },
  { unique: true, sparse: true }
);
