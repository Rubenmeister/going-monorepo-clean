import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Document & ConversationEntity;

@Schema({ timestamps: true, collection: 'conversations' })
export class ConversationEntity {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({
    type: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: Date,
      },
    ],
    default: [],
  })
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;

  @Prop({
    type: String,
    enum: ['active', 'handoff', 'resolved'],
    default: 'active',
    index: true,
  })
  status: 'active' | 'handoff' | 'resolved';

  @Prop()
  priority?: string;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(ConversationEntity);

// Create indexes
ConversationSchema.index({ userId: 1, status: 1 });
ConversationSchema.index({ status: 1, createdAt: -1 });
