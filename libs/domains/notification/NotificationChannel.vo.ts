import { Result, ok, err } from 'neverthrow';

export enum NotificationChannelType {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export class NotificationChannel {
  readonly value: NotificationChannelType;

  private constructor(value: NotificationChannelType) {
    this.value = value;
  }

  public static create(value: string): Result<NotificationChannel, Error> {
    const upperValue = value.toUpperCase() as NotificationChannelType;
    if (!Object.values(NotificationChannelType).includes(upperValue)) {
      return err(new Error('Invalid notification channel'));
    }
    return ok(new NotificationChannel(upperValue));
  }
  
  public toPrimitives(): string {
    return this.value;
  }
  
  public static fromPrimitives(value: string): NotificationChannel {
    return new NotificationChannel(value as NotificationChannelType);
  }
}