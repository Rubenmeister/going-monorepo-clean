import { Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { ChatMessage } from '../entities/chat-message.entity';

export const IChatMessageRepository = Symbol('IChatMessageRepository');

export interface IChatMessageRepository {
  save(message: ChatMessage): Promise<Result<void, Error>>;
  findByTripId(tripId: UUID, limit?: number): Promise<Result<ChatMessage[], Error>>;
  findUnreadByRecipient(recipientId: UUID): Promise<Result<ChatMessage[], Error>>;
  markAsRead(messageId: UUID): Promise<Result<void, Error>>;
  markAllAsReadForTrip(tripId: UUID, recipientId: UUID): Promise<Result<void, Error>>;
}
