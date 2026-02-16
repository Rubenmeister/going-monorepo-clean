import { Result } from 'neverthrow';

export const IWhatsAppGateway = Symbol('IWhatsAppGateway');

export interface IWhatsAppGateway {
  sendMessage(props: {
    to: string;
    message: string;
  }): Promise<Result<void, Error>>;

  sendTemplateMessage(props: {
    to: string;
    templateName: string;
    variables: Record<string, string>;
  }): Promise<Result<void, Error>>;
}
