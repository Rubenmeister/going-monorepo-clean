import { Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

/**
 * Email Notification Gateway
 * TODO: Replace stub with real provider (SendGrid, Nodemailer, AWS SES, etc.)
 *
 * Example integration with SendGrid:
 *   npm install @sendgrid/mail
 *   const sgMail = require('@sendgrid/mail');
 *   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 *   await sgMail.send({ to, from, subject, text });
 */
@Injectable()
export class EmailNotificationGateway implements INotificationGateway {
  private readonly logger = new Logger(EmailNotificationGateway.name);

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props = notification.toPrimitives();

    this.logger.log(`[EMAIL] Sending to userId=${props.userId}`);
    this.logger.log(`  Subject: ${props.title}`);
    this.logger.log(`  Body: ${props.body}`);

    // TODO: Integrate real email provider here
    // e.g. SendGrid, Nodemailer, AWS SES

    return ok(undefined);
  }
}
