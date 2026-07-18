import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { NotificationChannel } from '../value-objects/NotificationChannel.vo';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

export interface NotificationProps {
  id: UUID;
  userId: UUID; // El destinatario
  channel: NotificationChannel;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date;
  readAt?: Date;
  /**
   * Datos específicos del canal / del evento (teléfono destino para WhatsApp,
   * enlace de la acción, ids de referencia). Antes NO existía, así que los
   * gateways que leían `props.data` (SMS) siempre veían undefined.
   */
  data?: Record<string, any>;
}

export class Notification {
  readonly id: UUID;
  readonly userId: UUID;
  readonly channel: NotificationChannel;
  readonly title: string;
  readonly body: string;
  readonly status: NotificationStatus;
  readonly createdAt: Date;
  readonly sentAt?: Date;
  readonly readAt?: Date;
  readonly data?: Record<string, any>;

  private constructor(props: NotificationProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.channel = props.channel;
    this.title = props.title;
    this.body = props.body;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.sentAt = props.sentAt;
    this.readAt = props.readAt;
    this.data = props.data;
  }

  public static create(props: {
    userId: UUID;
    channel: NotificationChannel;
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Result<Notification, Error> {
    
    if (props.title.length === 0) {
      return err(new Error('Title is required'));
    }
    if (props.body.length === 0) {
      return err(new Error('Body is required'));
    }

    const notification = new Notification({
      id: uuidv4(),
      ...props,
      status: 'PENDING',
      createdAt: new Date(),
    });

    return ok(notification);
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      userId: this.userId,
      channel: this.channel.toPrimitives(),
      title: this.title,
      body: this.body,
      status: this.status,
      createdAt: this.createdAt,
      sentAt: this.sentAt,
      readAt: this.readAt,
      data: this.data,
    };
  }

  public static fromPrimitives(props: any): Notification {
    return new Notification({
      ...props,
      channel: NotificationChannel.fromPrimitives(props.channel),
    });
  }

  public markAsSent(): Result<void, Error> {
    if (this.status !== 'PENDING') {
      return err(new Error('Notification is not in pending state'));
    }
    (this as any).status = 'SENT';
    (this as any).sentAt = new Date();
    return ok(undefined);
  }
  
  public markAsRead(): Result<void, Error> {
    if (this.status === 'READ') {
      return ok(undefined); // Ya está leída
    }
    (this as any).status = 'READ';
    (this as any).readAt = new Date();
    return ok(undefined);
  }
  
  public markAsFailed(): Result<void, Error> {
    (this as any).status = 'FAILED';
    return ok(undefined);
  }
}