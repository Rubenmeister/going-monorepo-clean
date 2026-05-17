import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  UseGuards,
} from '@nestjs/common';
import {
  CreateNotificationDto,
  SendNotificationUseCase,
  GetUserNotificationsUseCase,
} from '@going-monorepo-clean/domains-notification-application';
import { INotificationRepository } from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';

/**
 * Auth: todas las rutas exigen JWT válido. Antes era 100% público — un
 * atacante podía leer notificaciones de cualquier usuario o crear notifs
 * fraudulentas. Ownership check en getNotifications: solo dueño o admin.
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    @Inject(INotificationRepository)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  /**
   * POST /notifications/send — crear nueva notificación
   *
   * Solo admins (o caller con role 'system') pueden crearlas. Las
   * notifs orgánicas se crean desde otros services (ride confirmed,
   * payment received, etc.) y deberían usar canal S2S, no este endpoint.
   */
  @Post('send')
  async sendNotification(
    @CurrentUser() caller: any,
    @Body() dto: CreateNotificationDto,
  ): Promise<any> {
    const roles: string[] = caller?.roles || [];
    if (!roles.includes('admin') && !roles.includes('system')) {
      throw new ForbiddenException('Requires admin or system role');
    }
    const result = await this.sendNotificationUseCase.execute(dto);
    if (result.isErr()) throw new BadRequestException(result.error.message);
    return result.value;
  }

  /**
   * GET /notifications/user/:userId — solo el dueño o admin pueden ver
   */
  @Get('user/:userId')
  async getNotifications(
    @CurrentUser() caller: any,
    @Param('userId') userId: UUID,
  ): Promise<any> {
    const callerId = caller?.id;
    const roles: string[] = caller?.roles || [];
    if (callerId !== userId && !roles.includes('admin')) {
      throw new ForbiddenException('No tenés acceso a notificaciones de otro usuario');
    }
    return this.getUserNotificationsUseCase.execute(userId);
  }

  /**
   * PATCH /notifications/:id/read — solo el dueño puede marcarla como leída
   */
  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() caller: any,
    @Param('id') id: UUID,
  ): Promise<any> {
    const findResult = await this.notificationRepo.findById(id);
    if (findResult.isErr()) throw new BadRequestException(findResult.error.message);

    const notification = findResult.value;
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);

    const callerId = caller?.id;
    const roles: string[] = caller?.roles || [];
    const recipientId = (notification.toPrimitives() as any).userId
      || (notification as any).recipientId;
    if (recipientId && recipientId !== callerId && !roles.includes('admin')) {
      throw new ForbiddenException('No podés marcar como leída la notificación de otro usuario');
    }

    notification.markAsRead();

    const updateResult = await this.notificationRepo.update(notification);
    if (updateResult.isErr()) throw new BadRequestException(updateResult.error.message);

    return { id, readAt: notification.toPrimitives().readAt };
  }
}
