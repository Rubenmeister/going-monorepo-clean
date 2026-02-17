import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  IChatMessageRepository,
  ChatMessage,
} from '@going-monorepo-clean/domains-notification-core';
import {
  ChatMessageModelSchema,
  ChatMessageDocument,
} from './schemas/chat-message.schema';

@Injectable()
export class MongooseChatMessageRepository implements IChatMessageRepository {
  private readonly logger = new Logger(MongooseChatMessageRepository.name);

  constructor(
    @InjectModel(ChatMessageModelSchema.name)
    private readonly model: Model<ChatMessageDocument>,
  ) {}

  async save(message: ChatMessage): Promise<Result<void, Error>> {
    try {
      const props = message.toPrimitives();
      await this.model.create(props);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Error saving chat message: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findByTripId(tripId: UUID, limit = 50): Promise<Result<ChatMessage[], Error>> {
    try {
      const docs = await this.model
        .find({ tripId })
        .sort({ createdAt: 1 })
        .limit(limit)
        .lean()
        .exec();

      const messages = docs.map((doc) => ChatMessage.fromPrimitives(doc));
      return ok(messages);
    } catch (error) {
      this.logger.error(`Error finding chat messages for trip: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findUnreadByRecipient(recipientId: UUID): Promise<Result<ChatMessage[], Error>> {
    try {
      const docs = await this.model
        .find({ recipientId, status: { $ne: 'READ' } })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
        .exec();

      const messages = docs.map((doc) => ChatMessage.fromPrimitives(doc));
      return ok(messages);
    } catch (error) {
      this.logger.error(`Error finding unread messages: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async markAsRead(messageId: UUID): Promise<Result<void, Error>> {
    try {
      await this.model.updateOne(
        { id: messageId },
        { $set: { status: 'READ', readAt: new Date() } },
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async markAllAsReadForTrip(tripId: UUID, recipientId: UUID): Promise<Result<void, Error>> {
    try {
      await this.model.updateMany(
        { tripId, recipientId, status: { $ne: 'READ' } },
        { $set: { status: 'READ', readAt: new Date() } },
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Error marking trip chat as read: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
