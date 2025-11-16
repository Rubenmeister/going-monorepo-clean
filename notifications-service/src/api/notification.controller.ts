import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import {
  CreateNotificationDto,
  SendNotificationUseCase,
  GetUserNotificationsUseCase,
} from '@going-monorepo-clean/domains-notification-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
  ) {}

  @Post('send')
  async sendNotification(@Body() dto: CreateNotificationDto): Promise<any> {
    const result = await this.sendNotificationUseCase.execute(dto);
    
    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }
    
    return result.value;
  }

  @Get('user/:userId')
  async getNotifications(@Param('userId') userId: UUID): Promise<any> {
    return this.getUserNotificationsUseCase.execute(userId);
  }
}