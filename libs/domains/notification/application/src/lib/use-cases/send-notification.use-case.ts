import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationRepository,
  INotificationGateway,
  NotificationChannel,
} from '@going-monorepo-clean/domains-notification-core';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    @Inject(INotificationRepository)
    private readonly notificationRepo: INotificationRepository,
    @Inject(INotificationGateway)
    private readonly notificationGateway: INotificationGateway,
  ) {}

  async execute(dto: CreateNotificationDto): Promise<Result<{ id: string }, Error>> {
    const channelVOResult = NotificationChannel.create(dto.channel);
    if (channelVOResult.isErr()) {
      return err(channelVOResult.error);
    }
    
    const notificationResult = Notification.create({
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      channel: channelVOResult.value,
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

    const sendResult = await this.notificationGateway.send(notification);

    if (sendResult.isErr()) {
      this.logger.warn(`Failed to send notification ${notification.id}: ${sendResult.error.message}`);
      notification.markAsFailed();
      await this.notificationRepo.update(notification);
      return err(sendResult.error);
    }

    notification.markAsSent();
    await this.notificationRepo.update(notification);

    this.logger.log(`Notification ${notification.id} sent successfully`);
    return ok({ id: notification.id });
  }
}