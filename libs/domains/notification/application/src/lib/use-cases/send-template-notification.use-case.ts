import { Inject, Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  Notification,
  NotificationChannel,
  NotificationTemplate,
  NotificationTemplateName,
  INotificationRepository,
  INotificationGateway,
  IWhatsAppNotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';
import { SendTemplateNotificationDto } from '../dto/send-template-notification.dto';

@Injectable()
export class SendTemplateNotificationUseCase {
  private readonly logger = new Logger(SendTemplateNotificationUseCase.name);

  constructor(
    @Inject(INotificationRepository)
    private readonly notificationRepo: INotificationRepository,
    @Inject(INotificationGateway)
    private readonly notificationGateway: INotificationGateway,
    @Inject(IWhatsAppNotificationGateway)
    private readonly whatsAppGateway: IWhatsAppNotificationGateway,
  ) {}

  async execute(dto: SendTemplateNotificationDto): Promise<void> {
    // Get the template
    const templateResult = NotificationTemplate.get(dto.templateName as NotificationTemplateName);
    if (templateResult.isErr()) {
      throw new BadRequestException(templateResult.error.message);
    }

    const template = templateResult.value;
    const { title, body } = template.render(dto.variables);

    // Create the channel
    const channelResult = NotificationChannel.create(dto.channel);
    if (channelResult.isErr()) {
      throw new BadRequestException(channelResult.error.message);
    }

    // Create the notification entity
    const notificationResult = Notification.create({
      userId: dto.userId,
      channel: channelResult.value,
      title,
      body,
    });
    if (notificationResult.isErr()) {
      throw new BadRequestException(notificationResult.error.message);
    }

    const notification = notificationResult.value;

    // Save to database
    const saveResult = await this.notificationRepo.save(notification);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }

    // Send via gateway (PUSH/EMAIL/SMS)
    const sendResult = await this.notificationGateway.send(notification);
    if (sendResult.isErr()) {
      this.logger.error(`Failed to send notification: ${sendResult.error.message}`);
      notification.markAsFailed();
      await this.notificationRepo.update(notification);
      return;
    }

    // If phone number provided and channel is SMS, also send via WhatsApp
    if (dto.phoneNumber && dto.channel.toUpperCase() === 'SMS') {
      const waResult = await this.whatsAppGateway.sendMessage({
        to: dto.phoneNumber,
        message: `${title}\n${body}`,
      });
      if (waResult.isErr()) {
        this.logger.warn(`WhatsApp delivery failed (non-blocking): ${waResult.error.message}`);
      }
    }

    notification.markAsSent();
    await this.notificationRepo.update(notification);
  }
}
