import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

/**
 * Twilio SMS Notification Gateway
 * Sends SMS notifications via Twilio API
 * Requirements:
 *   npm install twilio
 *   Environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */
@Injectable()
export class TwilioSmsGateway implements INotificationGateway, OnModuleInit {
  private readonly logger = new Logger(TwilioSmsGateway.name);
  private twilioClient: any;
  private fromNumber: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const twilio = require('twilio');
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      this.fromNumber =
        this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

      if (!accountSid || !authToken || !this.fromNumber) {
        this.logger.warn('Twilio credentials not configured - using mock mode');
        this.twilioClient = null;
        return;
      }

      this.twilioClient = twilio(accountSid, authToken);
      this.logger.log('Twilio SMS Gateway initialized successfully');
    } catch (error) {
      this.logger.warn(`Twilio initialization failed: ${error.message}`);
      this.twilioClient = null;
    }
  }

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props = notification.toPrimitives();

    this.logger.log(`[SMS] Sending to userId=${props.userId}`);
    this.logger.debug(`  Title: ${props.title}`);
    this.logger.debug(`  Body: ${props.body}`);

    // If Twilio is not configured, use mock mode
    if (!this.twilioClient) {
      this.logger.warn(`[SMS MOCK] Would send: ${props.title} - ${props.body}`);
      return ok(undefined);
    }

    try {
      // Get user phone number (in production, query from database)
      const phoneNumber = await this.getUserPhoneNumber(props.userId);

      if (!phoneNumber) {
        this.logger.warn(`No phone number found for user ${props.userId}`);
        return ok(undefined);
      }

      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        this.logger.error(`Invalid phone number format: ${phoneNumber}`);
        return err(new Error('Invalid phone number'));
      }

      // Format SMS message
      const smsBody = this.formatSmsMessage(props);

      // Send SMS via Twilio
      const message = await this.twilioClient.messages.create({
        body: smsBody,
        from: this.fromNumber,
        to: phoneNumber,
      });

      this.logger.log(`[SMS] Sent successfully. Message SID: ${message.sid}`);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`[SMS] Failed to send: ${error.message}`);
      return err(new Error(`SMS send failed: ${error.message}`));
    }
  }

  /**
   * Format notification for SMS (character limit ~160)
   */
  private formatSmsMessage(props: any): string {
    const title = props.title || '';
    const body = props.body || '';
    const rideId = props.data?.rideId;

    let message = `${title}: ${body}`;

    // Keep it under SMS limit (160 chars for single message, 153 for multi-part)
    if (message.length > 153) {
      message = message.substring(0, 150) + '...';
    }

    // Add ride ID as reference if available
    if (rideId) {
      message = `${message} (Ride: ${rideId})`;
    }

    return message;
  }

  /**
   * Validate phone number format (E.164)
   */
  private isValidPhoneNumber(phone: string): boolean {
    // E.164 format: +[country code][phone number]
    const e164Regex = /^\+?[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Get user's phone number from database
   */
  private async getUserPhoneNumber(userId: string): Promise<string | null> {
    // In production, query from user profile/phone verification table
    // return this.userRepository.getPhoneNumber(userId);

    // Mock implementation
    this.logger.debug(`[MOCK] Would fetch phone for user ${userId}`);
    return null;
  }
}
