import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import axios from 'axios';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

@Injectable()
export class MetaWhatsAppGateway implements INotificationGateway {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly logger = new Logger(MetaWhatsAppGateway.name);

  constructor(private readonly configService: ConfigService) {
    this.phoneNumberId = this.configService.get('META_WA_PHONE_NUMBER_ID') || '';
    this.accessToken = this.configService.get('META_WA_ACCESS_TOKEN') || '';

    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn('Meta WhatsApp keys not configured - WhatsApp gateway disabled');
    }
  }

  async send(notification: Notification): Promise<Result<void, Error>> {
    if (!this.phoneNumberId || !this.accessToken) {
      return err(new Error('Meta WhatsApp not configured'));
    }

    const { userId, body } = notification.toPrimitives();

    try {
      // En un escenario real, buscaríamos el teléfono del userId y enviaríamos un template
      await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: '1234567890', // Placeholder
          type: 'text',
          text: { body: body },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`WhatsApp message sent via Meta to ${userId}`);
      return ok(undefined);
    } catch (error: unknown) {
      const errRes = error as any;
      this.logger.error(
        'Failed to send WhatsApp message via Meta',
        errRes.response?.data || errRes.message,
      );
      return err(error as Error);
    }
  }
}
