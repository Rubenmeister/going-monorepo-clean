import { Injectable, Logger } from '@nestjs/common';
import { Result, ok } from 'neverthrow';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

/**
 * Adaptador Simulado. Reemplazar por FirebaseGateway, SendGridGateway, etc.
 */
@Injectable()
export class LogNotificationGateway implements INotificationGateway {
  private readonly logger = new Logger(LogNotificationGateway.name);

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props = notification.toPrimitives();
    
    this.logger.log(
      `--- NUEVA NOTIFICACIÓN [${props.channel}] ---
       TO: ${props.userId}
       TITLE: ${props.title}
       BODY: ${props.body}
       --------------------------------------`,
    );

    return ok(undefined);
  }
}