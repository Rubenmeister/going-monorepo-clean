import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import { IWhatsAppNotificationGateway } from '@going-monorepo-clean/domains-notification-core';

/**
 * Twilio WhatsApp Gateway Implementation.
 *
 * Uses the Twilio REST API to send WhatsApp messages.
 * Falls back to logging when TWILIO credentials are not configured.
 *
 * Required environment variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM (e.g., "whatsapp:+14155238886")
 */
@Injectable()
export class TwilioWhatsAppGateway implements IWhatsAppNotificationGateway {
  private readonly logger = new Logger(TwilioWhatsAppGateway.name);
  private readonly accountSid: string | undefined;
  private readonly authToken: string | undefined;
  private readonly fromNumber: string | undefined;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_FROM');
    this.isConfigured = !!(this.accountSid && this.authToken && this.fromNumber);

    if (!this.isConfigured) {
      this.logger.warn(
        'Twilio WhatsApp credentials not configured. Messages will be logged only.',
      );
    }
  }

  async sendMessage(props: {
    to: string;
    message: string;
  }): Promise<Result<void, Error>> {
    if (!this.isConfigured) {
      this.logger.log(
        `[STUB WhatsApp] To: ${props.to} | Message: ${props.message}`,
      );
      return ok(undefined);
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        From: this.fromNumber!,
        To: `whatsapp:${props.to}`,
        Body: props.message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Twilio API error: ${response.status} - ${errorBody}`);
        return err(new Error(`Twilio WhatsApp send failed: ${response.status}`));
      }

      this.logger.log(`WhatsApp message sent to ${props.to}`);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`WhatsApp send error: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async sendTemplateMessage(props: {
    to: string;
    templateSid: string;
    variables: Record<string, string>;
  }): Promise<Result<void, Error>> {
    if (!this.isConfigured) {
      this.logger.log(
        `[STUB WhatsApp Template] To: ${props.to} | Template: ${props.templateSid} | Vars: ${JSON.stringify(props.variables)}`,
      );
      return ok(undefined);
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        From: this.fromNumber!,
        To: `whatsapp:${props.to}`,
        ContentSid: props.templateSid,
        ContentVariables: JSON.stringify(props.variables),
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Twilio template API error: ${response.status} - ${errorBody}`);
        return err(new Error(`Twilio WhatsApp template send failed: ${response.status}`));
      }

      this.logger.log(`WhatsApp template "${props.templateSid}" sent to ${props.to}`);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`WhatsApp template send error: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
