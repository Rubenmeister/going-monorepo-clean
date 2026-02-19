import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type MessageStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';
export type MessageType = 'TEXT' | 'IMAGE' | 'MEDIA' | 'SYSTEM';

export interface MessageAttachment {
  type: 'image' | 'file';
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface ReadReceipt {
  userId: UUID;
  readAt: Date;
}

export interface MessageProps {
  id: UUID;
  rideId: UUID;
  senderId: UUID;
  receiverId: UUID;
  content: string;
  attachments: MessageAttachment[];
  readReceipts: ReadReceipt[];
  status: MessageStatus;
  messageType: MessageType;
  relatedTo?: UUID;
  createdAt: Date;
  updatedAt: Date;
}

export class Message {
  readonly id: UUID;
  readonly rideId: UUID;
  readonly senderId: UUID;
  readonly receiverId: UUID;
  readonly content: string;
  readonly attachments: MessageAttachment[];
  readonly readReceipts: ReadReceipt[];
  readonly status: MessageStatus;
  readonly messageType: MessageType;
  readonly relatedTo?: UUID;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: MessageProps) {
    this.id = props.id;
    this.rideId = props.rideId;
    this.senderId = props.senderId;
    this.receiverId = props.receiverId;
    this.content = props.content;
    this.attachments = props.attachments;
    this.readReceipts = props.readReceipts;
    this.status = props.status;
    this.messageType = props.messageType;
    this.relatedTo = props.relatedTo;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: {
    rideId: UUID;
    senderId: UUID;
    receiverId: UUID;
    content: string;
    attachments?: MessageAttachment[];
    messageType?: MessageType;
    relatedTo?: UUID;
  }): Result<Message, Error> {
    // Validation
    if (!props.rideId) {
      return err(new Error('Ride ID is required'));
    }
    if (!props.senderId) {
      return err(new Error('Sender ID is required'));
    }
    if (!props.receiverId) {
      return err(new Error('Receiver ID is required'));
    }
    if (props.senderId === props.receiverId) {
      return err(new Error('Sender and receiver cannot be the same'));
    }
    if (!props.content || props.content.trim().length === 0) {
      return err(new Error('Message content is required'));
    }
    if (props.content.length > 2000) {
      return err(
        new Error('Message content exceeds maximum length of 2000 characters')
      );
    }

    const now = new Date();
    const message = new Message({
      id: uuidv4(),
      rideId: props.rideId,
      senderId: props.senderId,
      receiverId: props.receiverId,
      content: props.content,
      attachments: props.attachments || [],
      readReceipts: [],
      status: 'PENDING',
      messageType: props.messageType || 'TEXT',
      relatedTo: props.relatedTo,
      createdAt: now,
      updatedAt: now,
    });

    return ok(message);
  }

  public markAsSent(): Result<void, Error> {
    if (this.status !== 'PENDING') {
      return err(new Error('Only pending messages can be marked as sent'));
    }
    (this as any).status = 'SENT';
    (this as any).updatedAt = new Date();
    return ok(undefined);
  }

  public markAsDelivered(): Result<void, Error> {
    if (this.status === 'PENDING') {
      return err(new Error('Message must be sent before marking as delivered'));
    }
    if (this.status === 'FAILED') {
      return err(new Error('Failed messages cannot be marked as delivered'));
    }
    (this as any).status = 'DELIVERED';
    (this as any).updatedAt = new Date();
    return ok(undefined);
  }

  public markAsRead(userId: UUID): Result<void, Error> {
    if (userId !== this.receiverId) {
      return err(new Error('Only the receiver can mark a message as read'));
    }

    const alreadyRead = this.readReceipts.some((r) => r.userId === userId);
    if (alreadyRead) {
      return ok(undefined);
    }

    (this as any).readReceipts = [
      ...this.readReceipts,
      { userId, readAt: new Date() },
    ];
    (this as any).status = 'READ';
    (this as any).updatedAt = new Date();
    return ok(undefined);
  }

  public markAsFailed(): Result<void, Error> {
    (this as any).status = 'FAILED';
    (this as any).updatedAt = new Date();
    return ok(undefined);
  }

  public addAttachment(attachment: MessageAttachment): Result<void, Error> {
    if (!attachment.url || !attachment.type) {
      return err(new Error('Attachment URL and type are required'));
    }
    (this as any).attachments = [...this.attachments, attachment];
    (this as any).updatedAt = new Date();
    return ok(undefined);
  }

  public isRead(): boolean {
    return this.status === 'READ';
  }

  public isDelivered(): boolean {
    return this.status === 'DELIVERED' || this.status === 'READ';
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      rideId: this.rideId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      content: this.content,
      attachments: this.attachments,
      readReceipts: this.readReceipts,
      status: this.status,
      messageType: this.messageType,
      relatedTo: this.relatedTo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static fromPrimitives(props: any): Message {
    return new Message({
      id: props.id,
      rideId: props.rideId,
      senderId: props.senderId,
      receiverId: props.receiverId,
      content: props.content,
      attachments: props.attachments || [],
      readReceipts: props.readReceipts || [],
      status: props.status,
      messageType: props.messageType || 'TEXT',
      relatedTo: props.relatedTo,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }
}
