import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

/**
 * SendGrid Email Notification Gateway
 * Sends email notifications via SendGrid API
 * Requirements:
 *   npm install @sendgrid/mail
 *   Environment variables: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
 */
@Injectable()
export class SendGridEmailGateway
  implements INotificationGateway, OnModuleInit
{
  private readonly logger = new Logger(SendGridEmailGateway.name);
  private sgMail: any;
  private fromEmail: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const sgMail = require('@sendgrid/mail');
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      this.fromEmail =
        this.configService.get<string>('SENDGRID_FROM_EMAIL') ||
        'noreply@going-platform.com';

      if (!apiKey) {
        this.logger.warn('SendGrid API key not configured - using mock mode');
        this.sgMail = null;
        return;
      }

      sgMail.setApiKey(apiKey);
      this.sgMail = sgMail;
      this.logger.log('SendGrid Email Gateway initialized successfully');
    } catch (error) {
      this.logger.warn(`SendGrid initialization failed: ${error.message}`);
      this.sgMail = null;
    }
  }

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props = notification.toPrimitives();

    this.logger.log(`[EMAIL] Sending to userId=${props.userId}`);
    this.logger.debug(`  Subject: ${props.title}`);
    this.logger.debug(`  Body: ${props.body}`);

    // If SendGrid is not configured, use mock mode
    if (!this.sgMail) {
      this.logger.warn(
        `[EMAIL MOCK] Would send: ${props.title} - ${props.body}`
      );
      return ok(undefined);
    }

    try {
      // Get user email address (in production, query from database)
      const recipientEmail = await this.getUserEmail(props.userId);

      if (!recipientEmail) {
        this.logger.warn(`No email found for user ${props.userId}`);
        return ok(undefined);
      }

      // Validate email format
      if (!this.isValidEmail(recipientEmail)) {
        this.logger.error(`Invalid email format: ${recipientEmail}`);
        return err(new Error('Invalid email address'));
      }

      // Build email content based on notification type
      const { subject, htmlContent, textContent } =
        this.buildEmailContent(props);

      // Send email via SendGrid
      const msg = {
        to: recipientEmail,
        from: this.fromEmail,
        subject,
        text: textContent,
        html: htmlContent,
        trackingSettings: {
          openTracking: {
            enable: true,
          },
          clickTracking: {
            enable: true,
          },
        },
      };

      const response = await this.sgMail.send(msg);

      this.logger.log(
        `[EMAIL] Sent successfully. Status: ${response[0].statusCode}`
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(`[EMAIL] Failed to send: ${error.message}`);
      return err(new Error(`Email send failed: ${error.message}`));
    }
  }

  /**
   * Build email content based on notification type
   */
  private buildEmailContent(props: any): {
    subject: string;
    htmlContent: string;
    textContent: string;
  } {
    const subject = props.title || 'Notification from Going Platform';
    const textContent = `${props.title}\n\n${props.body}`;

    // Build HTML email template
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2>${props.title}</h2>
            <p>${props.body}</p>

            ${
              props.data?.actionUrl
                ? `<a href="${props.data.actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Take Action</a>`
                : ''
            }

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
              This is an automated email from Going Platform. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return { subject, htmlContent, textContent };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get user's email address from database
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    // In production, query from user profile/authentication table
    // return this.userRepository.getEmail(userId);

    // Mock implementation
    this.logger.debug(`[MOCK] Would fetch email for user ${userId}`);
    return null;
  }
}
