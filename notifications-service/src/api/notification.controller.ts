import { Controller, Post, Body, Get, Param, Patch, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateNotificationDto,
  SendNotificationUseCase,
  GetUserNotificationsUseCase,
  MarkNotificationReadUseCase,
} from '@going-monorepo-clean/domains-notification-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
  ) {}

  @Post('send')
  @Roles('admin')
  @ApiOperation({ summary: 'Enviar una notificación (solo admin)' })
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
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Obtener notificaciones de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones del usuario' })
  async getNotifications(@Param('userId') userId: UUID): Promise<any> {
    return this.getUserNotificationsUseCase.execute(userId);
  }

  @Patch(':id/read')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async markAsRead(@Param('id') id: UUID): Promise<any> {
    await this.markNotificationReadUseCase.execute(id);
    return { message: 'Notification marked as read' };
  }
}
