import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'parcel_status_update'
  | 'message_received'
  | 'system_alert';

export interface NotificationProps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Notification {
  readonly id: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly content: string;
  readonly isRead: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: NotificationProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.type = props.type;
    this.title = props.title;
    this.content = props.content;
    this.isRead = props.isRead;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // Factory method para crear nueva notificación
  public static create(props: {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
  }): Result<Notification, Error> {
    if (!props.userId || props.userId.length === 0) {
      return err(new Error('userId is required'));
    }
    if (!props.title || props.title.length < 3) {
      return err(new Error('Title must be at least 3 characters'));
    }
    if (!props.content || props.content.length < 3) {
      return err(new Error('Content must be at least 3 characters'));
    }

    const now = new Date();
    const notification = new Notification({
      id: uuidv4(),
      ...props,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });

    return ok(notification);
  }

  // Lógica de negocio: Marcar como leída
  public markAsRead(): Result<Notification, Error> {
    if (this.isRead) {
      return err(new Error('Notification is already read'));
    }

    return ok(
      new Notification({
        ...this,
        isRead: true,
        updatedAt: new Date(),
      })
    );
  }

  // Serialización para persistencia
  public toPrimitives(): any {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      content: this.content,
      isRead: this.isRead,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Deserialización desde persistencia
  public static fromPrimitives(props: any): Notification {
    return new Notification({
      id: props.id,
      userId: props.userId,
      type: props.type as NotificationType,
      title: props.title,
      content: props.content,
      isRead: props.isRead,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }
}