import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConversationEntity, ConversationDocument } from '../schemas/conversation.schema';
import { Conversation } from '../../agent/conversation.service';

@Injectable()
export class MongoConversationRepository {
  constructor(
    @InjectModel('Conversation') private conversationModel: Model<ConversationDocument>
  ) {}

  async getOrCreate(userId: string): Promise<ConversationEntity> {
    let conv = await this.conversationModel.findOne({ userId });
    if (!conv) {
      conv = await this.conversationModel.create({
        userId,
        messages: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return conv;
  }

  async findOne(userId: string): Promise<ConversationEntity | null> {
    return this.conversationModel.findOne({ userId });
  }

  async save(userId: string, conversation: any): Promise<ConversationEntity> {
    return this.conversationModel.findOneAndUpdate(
      { userId },
      {
        ...conversation,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  async addMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    await this.conversationModel.findOneAndUpdate(
      { userId },
      {
        $push: {
          messages: {
            role,
            content,
            timestamp: new Date(),
          },
        },
        updatedAt: new Date(),
      }
    );
  }

  async updateStatus(userId: string, status: 'active' | 'handoff' | 'resolved'): Promise<void> {
    await this.conversationModel.findOneAndUpdate(
      { userId },
      { status, updatedAt: new Date() }
    );
  }

  async getHandoffQueue(status?: string): Promise<ConversationEntity[]> {
    const query: any = { status: 'handoff' };
    if (status) {
      query.priority = status;
    }
    return this.conversationModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean();
  }

  async getConversation(userId: string): Promise<ConversationEntity | null> {
    return this.conversationModel.findOne({ userId }).lean();
  }

  async getAllActive(): Promise<ConversationEntity[]> {
    return this.conversationModel
      .find({ status: { $in: ['active', 'handoff'] } })
      .sort({ createdAt: -1 })
      .lean();
  }
}
