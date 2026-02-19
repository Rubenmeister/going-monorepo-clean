import { Injectable, Logger } from '@nestjs/common';
import { Result, ok } from 'neverthrow';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

/**
 * SMS Notification Gateway
 * TODO: Replace stub with real provider (Twilio, AWS SNS, Vonage, etc.)
 *
 * Example integration with Twilio:
 *   npm install twilio
 *   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 *   await client.messages.create({ body, from: process.env.TWILIO_PHONE, to: recipientPhone });
 */
@Injectable()
export class SmsNotificationGateway implements INotificationGateway {
  private readonly logger = new Logger(SmsNotificationGateway.name);

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props = notification.toPrimitives();

    this.logger.log(`[SMS] Sending to userId=${props.userId}`);
    this.logger.log(`  Message: ${props.title} - ${props.body}`);

    // TODO: Integrate real SMS provider here
    // e.g. Twilio, AWS SNS, Vonage

    return ok(undefined);
  }
}
