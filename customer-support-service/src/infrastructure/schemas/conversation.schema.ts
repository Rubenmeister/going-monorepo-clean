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

  /**
   * Voz Chirp 3 HD preferida del usuario. Si está set, override la default
   * por género. Valores: 'Kore' | 'Despina' (fem) | 'Charon' | 'Algenib' (masc).
   * Sin valor → conversation.service usa la voz default del agentGender.
   */
  @Prop({
    type: String,
    enum: ['Kore', 'Despina', 'Charon', 'Algenib'],
  })
  voicePreference?: 'Kore' | 'Despina' | 'Charon' | 'Algenib';

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(ConversationEntity);

// Create indexes
ConversationSchema.index({ userId: 1, status: 1 });
ConversationSchema.index({ status: 1, createdAt: -1 });
