/**
 * Notification REST API Controller
 * Endpoints for notification management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { NotificationService } from '../application/services/notification.service';
import { NotificationPreferencesService } from '../application/services/notification-preferences.service';
import { CorporateJwtAuthGuard } from '../../shared/guards/corporate-jwt.guard';
import {
  SendNotificationDto,
  RegisterDeviceTokenDto,
  UpdatePreferencesDto,
} from './dtos/notification.dtos';

@Controller('api/notifications')
@UseGuards(CorporateJwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly preferencesService: NotificationPreferencesService
  ) {}

  /**
   * Get user notifications
   * GET /api/notifications
   */
  @Get()
  async getNotifications(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: any
  ) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const result = await this.notificationService.getNotifications(
      userId,
      companyId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0
    );

    return result;
  }

  /**
   * Get single notification
   * GET /api/notifications/:id
   */
  @Get(':id')
  async getNotification(@Param('id') notificationId: string, @Req() req: any) {
    const companyId = req.user.companyId;

    const notification = await this.notificationService.getNotification(
      notificationId,
      companyId
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  @Put(':id/read')
  async markAsRead(@Param('id') notificationId: string, @Req() req: any) {
    const companyId = req.user.companyId;

    const notification = await this.notificationService.markAsRead(
      notificationId,
      companyId
    );

    return notification;
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/mark-all-read
   */
  @Put('mark-all-read')
  async markAllAsRead(@Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const count = await this.notificationService.markAllAsRead(
      userId,
      companyId
    );

    return {
      message: 'All notifications marked as read',
      count,
    };
  }

  /**
   * Send notification (MANAGER+ only)
   * POST /api/notifications/send
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendNotification(@Body() dto: SendNotificationDto, @Req() req: any) {
    const companyId = req.user.companyId;

    // RBAC: Require MANAGER or SUPER_ADMIN
    if (!['MANAGER', 'SUPER_ADMIN'].includes(req.user.role)) {
      throw new UnauthorizedException(
        'Insufficient permissions to send notifications'
      );
    }

    const notification = await this.notificationService.sendNotification({
      userId: dto.userId,
      companyId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      description: dto.description,
      priority: dto.priority,
      channels: dto.channels,
      relatedEntity: dto.relatedEntity,
      actionUrl: dto.actionUrl,
      actionLabel: dto.actionLabel,
      data: dto.data,
    });

    return {
      message: 'Notification sent successfully',
      notification,
    };
  }

  /**
   * Send bulk notification (SUPER_ADMIN only)
   * POST /api/notifications/send-bulk
   */
  @Post('send-bulk')
  @HttpCode(HttpStatus.CREATED)
  async sendBulkNotification(@Body() dto: any, @Req() req: any) {
    const companyId = req.user.companyId;

    // RBAC: Require SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException(
        'Only admins can send bulk notifications'
      );
    }

    if (
      !dto.userIds ||
      !Array.isArray(dto.userIds) ||
      dto.userIds.length === 0
    ) {
      throw new BadRequestException(
        'userIds array is required and must not be empty'
      );
    }

    const notifications = await this.notificationService.sendBulkNotification(
      companyId,
      dto.userIds,
      {
        type: dto.type,
        title: dto.title,
        message: dto.message,
        description: dto.description,
        priority: dto.priority,
        channels: dto.channels,
        data: dto.data,
      }
    );

    return {
      message: `Notification sent to ${notifications.length} users`,
      count: notifications.length,
    };
  }

  /**
   * Get notification statistics
   * GET /api/notifications/stats/summary
   */
  @Get('stats/summary')
  async getStats(@Req() req: any) {
    const companyId = req.user.companyId;

    const stats = await this.notificationService.getStats(companyId);

    return stats;
  }

  /**
   * Get user preferences
   * GET /api/notifications/preferences
   */
  @Get('preferences/current')
  async getPreferences(@Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const preferences = await this.preferencesService.getPreferences(
      userId,
      companyId
    );

    return preferences;
  }

  /**
   * Update preferences
   * PUT /api/notifications/preferences
   */
  @Put('preferences/current')
  async updatePreferences(@Body() dto: UpdatePreferencesDto, @Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const preferences = await this.preferencesService.updatePreferences(
      userId,
      companyId,
      dto
    );

    return preferences;
  }

  /**
   * Enable push notifications
   * POST /api/notifications/preferences/push/enable
   */
  @Post('preferences/push/enable')
  async enablePush(@Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const preferences = await this.preferencesService.enablePush(
      userId,
      companyId
    );

    return preferences;
  }

  /**
   * Disable push notifications
   * POST /api/notifications/preferences/push/disable
   */
  @Post('preferences/push/disable')
  async disablePush(@Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const preferences = await this.preferencesService.disablePush(
      userId,
      companyId
    );

    return preferences;
  }

  /**
   * Enable email notifications
   * POST /api/notifications/preferences/email/enable
   */
  @Post('preferences/email/enable')
  async enableEmail(@Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const preferences = await this.preferencesService.enableEmail(
      userId,
      companyId
    );

    return preferences;
  }

  /**
   * Disable email notifications
   * POST /api/notifications/preferences/email/disable
   */
  @Post('preferences/email/disable')
  async disableEmail(@Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const preferences = await this.preferencesService.disableEmail(
      userId,
      companyId
    );

    return preferences;
  }

  /**
   * Unsubscribe from notification type
   * POST /api/notifications/preferences/unsubscribe/:type
   */
  @Post('preferences/unsubscribe/:type')
  async unsubscribeFromType(@Param('type') type: string, @Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const preferences = await this.preferencesService.unsubscribeFromType(
      userId,
      companyId,
      type
    );

    return preferences;
  }

  /**
   * Subscribe to notification type
   * POST /api/notifications/preferences/subscribe/:type
   */
  @Post('preferences/subscribe/:type')
  async subscribeToType(@Param('type') type: string, @Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    const preferences = await this.preferencesService.subscribeToType(
      userId,
      companyId,
      type
    );

    return preferences;
  }

  /**
   * Set quiet hours
   * POST /api/notifications/preferences/quiet-hours
   */
  @Post('preferences/quiet-hours')
  async setQuietHours(@Body() dto: any, @Req() req: any) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    if (!dto.start || !dto.end) {
      throw new BadRequestException(
        'start and end times are required (HH:mm format)'
      );
    }

    const preferences = await this.preferencesService.setQuietHours(
      userId,
      companyId,
      dto.start,
      dto.end,
      dto.enabled !== false
    );

    return preferences;
  }

  /**
   * Register device token
   * POST /api/notifications/device-tokens
   */
  @Post('device-tokens')
  @HttpCode(HttpStatus.CREATED)
  async registerDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
    @Req() req: any
  ) {
    const userId = req.user.sub;
    const companyId = req.user.companyId;

    if (!dto.fcmToken || !dto.deviceType) {
      throw new BadRequestException('fcmToken and deviceType are required');
    }

    await this.notificationService.registerDeviceToken(
      userId,
      companyId,
      dto.fcmToken,
      dto.deviceType,
      dto.deviceName
    );

    return {
      message: 'Device token registered successfully',
      fcmToken: dto.fcmToken,
    };
  }

  /**
   * Unregister device token
   * DELETE /api/notifications/device-tokens/:token
   */
  @Delete('device-tokens/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterDeviceToken(
    @Param('token') fcmToken: string,
    @Req() req: any
  ): Promise<void> {
    const userId = req.user.sub;

    // Verify token belongs to user (optional security check)
    await this.notificationService.unregisterDeviceToken(fcmToken);
  }
}
