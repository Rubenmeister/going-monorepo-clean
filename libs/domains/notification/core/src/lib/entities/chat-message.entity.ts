import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type ChatMessageStatus = 'SENT' | 'DELIVERED' | 'READ';
export type ChatParticipantRole = 'user' | 'driver' | 'admin';

export interface ChatMessageProps {
  id: UUID;
  tripId: UUID;
  senderId: UUID;
  senderRole: ChatParticipantRole;
  recipientId: UUID;
  content: string;
  status: ChatMessageStatus;
  createdAt: Date;
  readAt?: Date;
}

export class ChatMessage {
  readonly id: UUID;
  readonly tripId: UUID;
  readonly senderId: UUID;
  readonly senderRole: ChatParticipantRole;
  readonly recipientId: UUID;
  readonly content: string;
  readonly status: ChatMessageStatus;
  readonly createdAt: Date;
  readonly readAt?: Date;

  private constructor(props: ChatMessageProps) {
    this.id = props.id;
    this.tripId = props.tripId;
    this.senderId = props.senderId;
    this.senderRole = props.senderRole;
    this.recipientId = props.recipientId;
    this.content = props.content;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.readAt = props.readAt;
  }

  public static create(props: {
    tripId: UUID;
    senderId: UUID;
    senderRole: ChatParticipantRole;
    recipientId: UUID;
    content: string;
  }): Result<ChatMessage, Error> {
    if (!props.content || props.content.trim().length === 0) {
      return err(new Error('Message content cannot be empty'));
    }
    if (props.content.length > 2000) {
      return err(new Error('Message content cannot exceed 2000 characters'));
    }

    return ok(
      new ChatMessage({
        id: uuidv4(),
        ...props,
        content: props.content.trim(),
        status: 'SENT',
        createdAt: new Date(),
      }),
    );
  }

  public markAsDelivered(): Result<void, Error> {
    if (this.status === 'READ') return ok(undefined);
    (this as any).status = 'DELIVERED';
    return ok(undefined);
  }

  public markAsRead(): Result<void, Error> {
    if (this.status === 'READ') return ok(undefined);
    (this as any).status = 'READ';
    (this as any).readAt = new Date();
    return ok(undefined);
  }

  public toPrimitives(): Record<string, unknown> {
    return {
      id: this.id,
      tripId: this.tripId,
      senderId: this.senderId,
      senderRole: this.senderRole,
      recipientId: this.recipientId,
      content: this.content,
      status: this.status,
      createdAt: this.createdAt,
      readAt: this.readAt,
    };
  }

  public static fromPrimitives(props: Record<string, any>): ChatMessage {
    return new ChatMessage(props as ChatMessageProps);
  }
}
