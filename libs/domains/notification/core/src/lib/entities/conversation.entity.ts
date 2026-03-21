import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { Message } from './message.entity';

export interface LastMessage {
  messageId: UUID;
  content: string;
  senderId: UUID;
  timestamp: Date;
}

export interface UnreadCount {
  userId: UUID;
  count: number;
}

export interface ConversationProps {
  id: UUID;
  rideId: UUID;
  participants: UUID[];
  lastMessage?: LastMessage;
  unreadCounts: UnreadCount[];
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation {
  readonly id: UUID;
  readonly rideId: UUID;
  readonly participants: UUID[];
  readonly lastMessage?: LastMessage;
  readonly unreadCounts: UnreadCount[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: ConversationProps) {
    this.id = props.id;
    this.rideId = props.rideId;
    this.participants = props.participants;
    this.lastMessage = props.lastMessage;
    this.unreadCounts = props.unreadCounts;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: {
    rideId: UUID;
    participants: UUID[];
  }): Result<Conversation, Error> {
    // Validation
    if (!props.rideId) {
      return err(new Error('Ride ID is required'));
    }
    if (!props.participants || props.participants.length < 2) {
      return err(new Error('At least 2 participants are required'));
    }
    if (props.participants.length !== new Set(props.participants).size) {
      return err(new Error('Duplicate participants are not allowed'));
    }

    const now = new Date();
    const conversation = new Conversation({
      id: uuidv4(),
      rideId: props.rideId,
      participants: props.participants,
      unreadCounts: props.participants.map((userId) => ({
        userId,
        count: 0,
      })),
      createdAt: now,
      updatedAt: now,
    });

    return ok(conversation);
  }

  public addMessage(message: Message): Result<void, Error> {
    if (message.rideId !== this.rideId) {
      return err(new Error('Message does not belong to this conversation'));
    }
    if (
      !this.participants.includes(message.senderId) ||
      !this.participants.includes(message.receiverId)
    ) {
      return err(
        new Error('Message participants do not match conversation participants')
      );
    }

    // Update last message
    (this as any).lastMessage = {
      messageId: message.id,
      content: message.content,
      senderId: message.senderId,
      timestamp: message.createdAt,
    };

    // Increment unread count for receiver
    (this as any).unreadCounts = this.unreadCounts.map((uc) =>
      uc.userId === message.receiverId ? { ...uc, count: uc.count + 1 } : uc
    );

    (this as any).updatedAt = new Date();
    return ok(undefined);
  }

  public markAllAsRead(userId: UUID): Result<void, Error> {
    if (!this.participants.includes(userId)) {
      return err(new Error('User is not a participant of this conversation'));
    }

    (this as any).unreadCounts = this.unreadCounts.map((uc) =>
      uc.userId === userId ? { ...uc, count: 0 } : uc
    );

    (this as any).updatedAt = new Date();
    return ok(undefined);
  }

  public markMessageAsRead(userId: UUID): Result<void, Error> {
    if (!this.participants.includes(userId)) {
      return err(new Error('User is not a participant of this conversation'));
    }

    const unreadCountIndex = this.unreadCounts.findIndex(
      (uc) => uc.userId === userId
    );
    if (
      unreadCountIndex !== -1 &&
      this.unreadCounts[unreadCountIndex].count > 0
    ) {
      (this as any).unreadCounts[unreadCountIndex] = {
        ...this.unreadCounts[unreadCountIndex],
        count: this.unreadCounts[unreadCountIndex].count - 1,
      };
    }

    (this as any).updatedAt = new Date();
    return ok(undefined);
  }

  public getUnreadCount(userId: UUID): number {
    const unreadCount = this.unreadCounts.find((uc) => uc.userId === userId);
    return unreadCount?.count || 0;
  }

  public getTotalUnreadCount(): number {
    return this.unreadCounts.reduce((total, uc) => total + uc.count, 0);
  }

  public getOtherParticipant(userId: UUID): UUID | null {
    if (this.participants.length !== 2) {
      return null;
    }
    return this.participants.find((p) => p !== userId) || null;
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      rideId: this.rideId,
      participants: this.participants,
      lastMessage: this.lastMessage,
      unreadCounts: this.unreadCounts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static fromPrimitives(props: any): Conversation {
    return new Conversation({
      id: props.id,
      rideId: props.rideId,
      participants: props.participants,
      lastMessage: props.lastMessage,
      unreadCounts: props.unreadCounts || [],
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }
}
