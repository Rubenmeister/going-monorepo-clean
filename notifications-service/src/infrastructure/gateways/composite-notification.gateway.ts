import { Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';
import { SendGridEmailGateway } from './email-notification.gateway';
import { TwilioSmsGateway } from './sms-notification.gateway';
import { FirebasePushNotificationGateway } from './push-notification.gateway';

/**
 * Composite gateway that routes notifications to the appropriate
 * channel-specific gateway based on the notification channel type.
 */
@Injectable()
export class CompositeNotificationGateway implements INotificationGateway {
  private readonly logger = new Logger(CompositeNotificationGateway.name);

  constructor(
    private readonly emailGateway: SendGridEmailGateway,
    private readonly smsGateway: TwilioSmsGateway,
    private readonly pushGateway: FirebasePushNotificationGateway
  ) {}

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props = notification.toPrimitives();
    const channel = props.channel;

    switch (channel) {
      case 'EMAIL':
        return this.emailGateway.send(notification);
      case 'SMS':
        return this.smsGateway.send(notification);
      case 'PUSH':
        return this.pushGateway.send(notification);
      default:
        this.logger.warn(`Unknown notification channel: ${channel}`);
        return err(new Error(`Unsupported notification channel: ${channel}`));
    }
  }
}
