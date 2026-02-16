import { Injectable, Logger } from '@nestjs/common';
import { Result, ok } from 'neverthrow';
import { IWhatsAppGateway } from '@going-monorepo-clean/domains-transport-core';

@Injectable()
export class LogWhatsAppGateway implements IWhatsAppGateway {
  private readonly logger = new Logger(LogWhatsAppGateway.name);

  async sendMessage(props: {
    to: string;
    message: string;
  }): Promise<Result<void, Error>> {
    this.logger.log(`[STUB] WhatsApp message to ${props.to}: ${props.message}`);
    return ok(undefined);
  }

  async sendTemplateMessage(props: {
    to: string;
    templateName: string;
    variables: Record<string, string>;
  }): Promise<Result<void, Error>> {
    this.logger.log(
      `[STUB] WhatsApp template "${props.templateName}" to ${props.to}: ${JSON.stringify(props.variables)}`,
    );
    return ok(undefined);
  }
}
