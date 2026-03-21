import { Message } from '../entities';

/**
 * Message Repository Interface
 */
export interface IMessageRepository {
  /**
   * Save a new message
   */
  create(message: Message): Promise<Message>;

  /**
   * Get message by ID
   */
  findById(id: string): Promise<Message | null>;

  /**
   * Get messages for a ride
   */
  findByRideId(rideId: string, limit?: number): Promise<Message[]>;

  /**
   * Get unread messages for a user
   */
  findUnreadForUser(userId: string): Promise<Message[]>;

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): Promise<Message>;

  /**
   * Get conversation between two users for a ride
   */
  findConversation(
    rideId: string,
    userId: string,
    otherUserId: string,
    limit?: number
  ): Promise<Message[]>;

  /**
   * Delete a message
   */
  delete(id: string): Promise<void>;
}
