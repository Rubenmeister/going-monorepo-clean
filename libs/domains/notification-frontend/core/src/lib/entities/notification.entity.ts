import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export type NotificationStatus = 'PENDING' | 'SENT' | 'READ' | 'FAILED';
export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS';

export interface NotificationProps {
  id: UUID;
  userId: UUID;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: Date;
  readAt?: Date;
}

export class Notification {
  readonly id: UUID;
  readonly userId: UUID;
  readonly channel: NotificationChannel;
  readonly title: string;
  readonly message: string;
  readonly status: NotificationStatus;
  readonly createdAt: Date;
  readonly readAt?: Date;

  constructor(props: NotificationProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.channel = props.channel;
    this.title = props.title;
    this.message = props.message;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.readAt = props.readAt;
  }

  public static fromPrimitives(props: any): Notification {
    // Los VOs Channel y Status se manejan como strings en la capa superior (UI)
    return new Notification({
      ...props,
      // Asume que las fechas vienen como objetos Date o strings válidos
      createdAt: new Date(props.createdAt),
      readAt: props.readAt ? new Date(props.readAt) : undefined,
    });
  }
}