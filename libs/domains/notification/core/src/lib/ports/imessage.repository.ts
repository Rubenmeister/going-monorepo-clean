import { Result } from 'neverthrow';
import { Message } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IMessageRepository = Symbol('IMessageRepository');

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: 'newest' | 'oldest';
}

export interface IMessageRepository {
  // Message operations
  save(message: Message): Promise<Result<void, Error>>;
  update(message: Message): Promise<Result<void, Error>>;
  findById(messageId: UUID): Promise<Result<Message | null, Error>>;
  findByRideId(
    rideId: UUID,
    pagination: PaginationParams
  ): Promise<Result<Message[], Error>>;
  deleteMessage(messageId: UUID): Promise<Result<void, Error>>;

  // Conversation operations
  saveConversation(conversation: Conversation): Promise<Result<void, Error>>;
  updateConversation(conversation: Conversation): Promise<Result<void, Error>>;
  findConversation(
    rideId: UUID,
    userId1: UUID,
    userId2: UUID
  ): Promise<Result<Conversation | null, Error>>;
  findConversationsByUserId(
    userId: UUID,
    limit: number
  ): Promise<Result<Conversation[], Error>>;

  // Unread operations
  getUnreadCount(userId: UUID): Promise<Result<number, Error>>;
  getUnreadCountByRide(
    rideId: UUID,
    userId: UUID
  ): Promise<Result<number, Error>>;
}
