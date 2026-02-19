/**
 * Message Entity
 * Represents a chat message between user and driver
 */
export class Message {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;

  content: string;
  attachments: Array<{
    type: 'image' | 'file';
    url: string;
    size: number;
  }> = [];

  readAt?: Date;
  createdAt: Date;

  constructor(props: {
    id: string;
    rideId: string;
    senderId: string;
    receiverId: string;
    content: string;
    attachments?: Array<{ type: 'image' | 'file'; url: string; size: number }>;
    readAt?: Date;
    createdAt?: Date;
  }) {
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    this.id = props.id;
    this.rideId = props.rideId;
    this.senderId = props.senderId;
    this.receiverId = props.receiverId;
    this.content = props.content;
    this.attachments = props.attachments || [];
    this.readAt = props.readAt;
    this.createdAt = props.createdAt || new Date();
  }

  /**
   * Mark message as read
   */
  markAsRead(): void {
    this.readAt = new Date();
  }

  /**
   * Check if message is read
   */
  isRead(): boolean {
    return !!this.readAt;
  }

  /**
   * Check if message has attachments
   */
  hasAttachments(): boolean {
    return this.attachments.length > 0;
  }

  toObject() {
    return {
      id: this.id,
      rideId: this.rideId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      content: this.content,
      attachments: this.attachments,
      readAt: this.readAt,
      isRead: this.isRead(),
      createdAt: this.createdAt,
    };
  }
}
