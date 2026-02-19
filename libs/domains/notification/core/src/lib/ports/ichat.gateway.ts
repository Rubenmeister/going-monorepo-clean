import { Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IChatGateway = Symbol('IChatGateway');

export interface WebSocketMessagePayload {
  rideId: UUID;
  messageId: UUID;
  senderId: UUID;
  receiverId: UUID;
  content: string;
  timestamp: Date;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

export interface TypingIndicatorPayload {
  rideId: UUID;
  userId: UUID;
  isTyping: boolean;
}

export interface PresencePayload {
  rideId: UUID;
  userId: UUID;
  status: 'online' | 'offline';
}

export interface IChatGateway {
  // Message broadcasting
  broadcastMessage(
    payload: WebSocketMessagePayload
  ): Promise<Result<void, Error>>;
  broadcastMessageRead(
    messageId: UUID,
    rideId: UUID,
    readBy: UUID
  ): Promise<Result<void, Error>>;

  // Typing indicators
  broadcastTypingIndicator(
    payload: TypingIndicatorPayload
  ): Promise<Result<void, Error>>;

  // Presence
  broadcastPresence(payload: PresencePayload): Promise<Result<void, Error>>;
  getActiveUsersForRide(rideId: UUID): Promise<Result<UUID[], Error>>;

  // User management
  joinRoom(
    rideId: UUID,
    userId: UUID,
    socketId: string
  ): Promise<Result<void, Error>>;
  leaveRoom(rideId: UUID, userId: UUID): Promise<Result<void, Error>>;

  // Notifications
  notifyUser(
    userId: UUID,
    event: string,
    data: any
  ): Promise<Result<void, Error>>;
}
