import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateNotificationDto,
  SendNotificationUseCase,
  GetUserNotificationsUseCase,
} from '@going-monorepo-clean/domains-notification-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Enviar una notificación' })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ status: 201, description: 'Notificación enviada exitosamente' })
  @ApiResponse({ status: 400, description: 'Error al enviar la notificación' })
  async sendNotification(@Body() dto: CreateNotificationDto): Promise<any> {
    const result = await this.sendNotificationUseCase.execute(dto);

    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener notificaciones de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones del usuario' })
  async getNotifications(@Param('userId') userId: UUID): Promise<any> {
    return this.getUserNotificationsUseCase.execute(userId);
  }
}
