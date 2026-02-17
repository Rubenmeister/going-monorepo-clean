import { Result } from 'neverthrow';

export const IWhatsAppNotificationGateway = Symbol('IWhatsAppNotificationGateway');

export interface IWhatsAppNotificationGateway {
  /** Sends a free-form WhatsApp message */
  sendMessage(props: {
    to: string;
    message: string;
  }): Promise<Result<void, Error>>;

  /** Sends a pre-approved WhatsApp template message via Twilio */
  sendTemplateMessage(props: {
    to: string;
    templateSid: string;
    variables: Record<string, string>;
  }): Promise<Result<void, Error>>;
}
