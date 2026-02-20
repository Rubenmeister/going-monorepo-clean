import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { IMessageRepository } from '../../../domain/ports';

/**
 * MongoDB Message Repository
 */
@Injectable()
export class MongoMessageRepository implements IMessageRepository {
  constructor(
    @InjectModel('Message') private messageModel: Model<MessageDocument>
  ) {}

  async create(message: any): Promise<any> {
    const created = await this.messageModel.create({
      messageId: message.id,
      rideId: message.rideId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      attachments: message.attachments || [],
      createdAt: message.createdAt,
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<any> {
    const doc = await this.messageModel.findOne({ messageId: id });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByRideId(rideId: string, limit?: number): Promise<any[]> {
    const query = this.messageModel.find({ rideId }).sort({ createdAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const docs = await query;
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findUnreadForUser(userId: string): Promise<any[]> {
    const docs = await this.messageModel.find({
      receiverId: userId,
      readAt: { $exists: false },
    });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async markAsRead(messageId: string): Promise<any> {
    const doc = await this.messageModel.findOneAndUpdate(
      { messageId },
      { readAt: new Date() },
      { new: true }
    );

    if (!doc) {
      throw new Error(`Message ${messageId} not found`);
    }

    return this.mapToEntity(doc);
  }

  async findConversation(
    rideId: string,
    userId: string,
    otherUserId: string,
    limit?: number
  ): Promise<any[]> {
    const query = this.messageModel
      .find({
        rideId,
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
      .sort({ createdAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const docs = await query;
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async delete(id: string): Promise<void> {
    await this.messageModel.deleteOne({ messageId: id });
  }

  private mapToEntity(doc: any): any {
    return {
      id: doc.messageId,
      rideId: doc.rideId,
      senderId: doc.senderId,
      receiverId: doc.receiverId,
      content: doc.content,
      attachments: doc.attachments,
      readAt: doc.readAt,
      createdAt: doc.createdAt,
    };
  }
}
