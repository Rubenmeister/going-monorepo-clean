import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import twilio from 'twilio';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

type TwilioClient = ReturnType<typeof twilio>;

@Injectable()
export class TwilioSmsGateway implements INotificationGateway {
  private twilioClient: TwilioClient | null = null;
  private fromNumber = '';
  private readonly logger = new Logger(TwilioSmsGateway.name);

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get('TWILIO_FROM_NUMBER') || '';

    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio keys not configured - SMS gateway disabled');
    }
  }

  async send(notification: Notification): Promise<Result<void, Error>> {
    if (!this.twilioClient) {
      return err(new Error('Twilio not configured'));
    }

    const { userId, content } = notification.toPrimitives();

    try {
      // TODO: Implement phone lookup from user profile
      // For now, this is a placeholder - you would look up the user's phone number
      await this.twilioClient.messages.create({
        body: content,
        from: this.fromNumber,
        to: '+1234567890', // Placeholder - replace with user lookup
      });

      this.logger.log(`SMS sent via Twilio to ${userId}`);
      return ok(undefined);
    } catch (error) {
      this.logger.error('Failed to send SMS via Twilio', error);
      return err(error as Error);
    }
  }
}
