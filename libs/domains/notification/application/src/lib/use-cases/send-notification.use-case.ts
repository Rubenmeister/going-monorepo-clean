import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationRepository,
  INotificationGateway,
  I_NOTIFICATION_REPOSITORY,
} from '@going-monorepo-clean/domains-notification-core';
import { CreateNotificationDto } from '../dto/create-notification.dto';

// Injection token for gateway
export const I_NOTIFICATION_GATEWAY = Symbol('INotificationGateway');

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
    @Inject(I_NOTIFICATION_GATEWAY)
    private readonly notificationGateway: INotificationGateway,
  ) {}

  async execute(dto: CreateNotificationDto): Promise<Result<{ id: string }, Error>> {
    // Create notification with properties that match the entity
    const notificationResult = Notification.create({
      userId: dto.userId,
      type: dto.type ?? 'system_alert',
      title: dto.title,
      content: dto.body, // Map body -> content to match entity
    });

    if (notificationResult.isErr()) {
      return err(notificationResult.error);
    }
    const notification = notificationResult.value;

    const saveResult = await this.notificationRepo.save(notification);
    if (saveResult.isErr()) {
      this.logger.error(`Failed to save notification: ${saveResult.error.message}`);
      return err(new Error(`Failed to save notification: ${saveResult.error.message}`));
    }

    // Try to send via gateway
    const sendResult = await this.notificationGateway.send(notification);

    if (sendResult.isErr()) {
      this.logger.warn(`Failed to send notification ${notification.id}: ${sendResult.error.message}`);
      // TODO: Add markAsFailed method to entity if needed
      return err(sendResult.error);
    }

    // TODO: Add markAsSent method to entity if needed
    this.logger.log(`Notification ${notification.id} sent successfully`);
    return ok({ id: notification.id });
  }
}