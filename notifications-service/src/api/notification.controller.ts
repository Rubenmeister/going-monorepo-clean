import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import {
  CreateNotificationDto,
  SendNotificationUseCase,
  GetUserNotificationsUseCase,
} from '@going-monorepo-clean/domains-notification-application';
import { INotificationRepository } from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    @Inject(INotificationRepository)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  /** POST /notifications/send */
  @Post('send')
  async sendNotification(@Body() dto: CreateNotificationDto): Promise<any> {
    const result = await this.sendNotificationUseCase.execute(dto);
    if (result.isErr()) throw new BadRequestException(result.error.message);
    return result.value;
  }

  /** GET /notifications/user/:userId */
  @Get('user/:userId')
  async getNotifications(@Param('userId') userId: UUID): Promise<any> {
    return this.getUserNotificationsUseCase.execute(userId);
  }

  /** PATCH /notifications/:id/read — marks a notification as read */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: UUID): Promise<any> {
    const findResult = await this.notificationRepo.findById(id);
    if (findResult.isErr()) throw new BadRequestException(findResult.error.message);

    const notification = findResult.value;
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);

    notification.markAsRead();

    const updateResult = await this.notificationRepo.update(notification);
    if (updateResult.isErr()) throw new BadRequestException(updateResult.error.message);

    return { id, readAt: notification.toPrimitives().readAt };
  }
}
