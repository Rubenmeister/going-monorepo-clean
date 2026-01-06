import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import { Resend } from 'resend';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

@Injectable()
export class ResendEmailGateway implements INotificationGateway {
  private resend: Resend | null = null;
  private readonly logger = new Logger(ResendEmailGateway.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('Resend API key not configured - email gateway disabled');
    }
  }

  async send(notification: Notification): Promise<Result<void, Error>> {
    if (!this.resend) {
      return err(new Error('Resend not configured'));
    }

    const { userId, title, body } = notification.toPrimitives();

    try {
      // En un escenario real, buscaríamos el email del userId en la DB
      // Aquí usamos un placeholder o extraemos del cuerpo si viene ahí
      await this.resend.emails.send({
        from: 'GOING <noreply@going.app>',
        to: ['delivered@resend.dev'], // Placeholder
        subject: title,
        html: `<strong>${body}</strong>`,
      });

      this.logger.log(`Email sent via Resend to ${userId}`);
      return ok(undefined);
    } catch (error) {
      this.logger.error('Failed to send email via Resend', error);
      return err(error as Error);
    }
  }
}
