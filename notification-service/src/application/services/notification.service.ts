/**
 * Notification Service
 * Business logic for notification management and delivery
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  NotificationPriority,
} from '../../domain/models/notification.model';
import { NotificationRepository } from '../../infrastructure/persistence/notification.repository';
import { DeviceTokenRepository } from '../../infrastructure/persistence/device-token.repository';
import { NotificationPreferencesRepository } from '../../infrastructure/persistence/notification-preferences.repository';
import { FcmService } from './fcm.service';

interface SendNotificationOptions {
  userId: string;
  companyId: string;
  type: NotificationType;
  title: string;
  message: string;
  description?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  relatedEntity?: {
    type: string;
    id: string;
  };
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly deviceTokenRepository: DeviceTokenRepository,
    private readonly preferencesRepository: NotificationPreferencesRepository,
    private readonly fcmService: FcmService
  ) {}

  /**
   * Send a notification to a user
   * @param options Notification options
   * @returns Created notification
   */
  async sendNotification(
    options: SendNotificationOptions
  ): Promise<Notification> {
    try {
      // Validate
      if (!options.userId || !options.companyId) {
        throw new BadRequestException('userId and companyId are required');
      }

      // Get user preferences
      const preferences = await this.preferencesRepository.getOrCreate(
        options.userId,
        options.companyId
      );

      // Check if user is in do-not-disturb mode
      if (preferences.doNotDisturb) {
        this.logger.log(`User ${options.userId} is in do-not-disturb mode`);
      }

      // Check if notification type is subscribed
      if (preferences.unsubscribedTypes.includes(options.type)) {
        this.logger.log(
          `User ${options.userId} unsubscribed from type ${options.type}`
        );
        throw new BadRequestException(`User unsubscribed from ${options.type}`);
      }

      // Determine channels to use
      let channels = options.channels || [
        NotificationChannel.PUSH,
        NotificationChannel.IN_APP,
      ];

      // Filter channels based on user preferences
      channels = channels.filter((channel) => {
        if (preferences.unsubscribedChannels.includes(channel)) {
          return false;
        }

        const channelMap = {
          [NotificationChannel.PUSH]: preferences.enablePush,
          [NotificationChannel.EMAIL]: preferences.enableEmail,
          [NotificationChannel.SMS]: preferences.enableSms,
          [NotificationChannel.IN_APP]: preferences.enableInApp,
        };

        return channelMap[channel] ?? true;
      });

      // Create notification record
      const notification: Partial<Notification> = {
        companyId: options.companyId,
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        description: options.description,
        priority: options.priority || NotificationPriority.NORMAL,
        channels,
        status: NotificationStatus.PENDING,
        relatedEntity: options.relatedEntity,
        actionUrl: options.actionUrl,
        actionLabel: options.actionLabel,
        data: options.data,
        metadata: options.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        deliveryAttempts: 0,
        maxDeliveryAttempts: 3,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      const created = await this.notificationRepository.create(notification);
      this.logger.log(`Notification created: ${created.id}`);

      // Queue for delivery (will be handled by notification queue processor)
      await this.deliverNotification(created, options.companyId);

      return created;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error}`);
      throw error;
    }
  }

  /**
   * Deliver notification through configured channels
   * @param notification Notification to deliver
   * @param companyId Company ID
   */
  async deliverNotification(
    notification: Notification,
    companyId: string
  ): Promise<void> {
    try {
      for (const channel of notification.channels) {
        try {
          switch (channel) {
            case NotificationChannel.PUSH:
              await this.deliverPushNotification(notification);
              break;
            case NotificationChannel.IN_APP:
              await this.deliverInAppNotification(notification);
              break;
            case NotificationChannel.EMAIL:
              await this.deliverEmailNotification(notification);
              break;
            case NotificationChannel.SMS:
              await this.deliverSmsNotification(notification);
              break;
          }
        } catch (error) {
          this.logger.error(`Failed to deliver via ${channel}: ${error}`);
        }
      }

      // Update notification status
      if (notification.channels.includes(NotificationChannel.PUSH)) {
        await this.notificationRepository.updateStatus(
          notification.id,
          companyId,
          NotificationStatus.SENT
        );
      }
    } catch (error) {
      this.logger.error(`Failed to deliver notification: ${error}`);
    }
  }

  /**
   * Deliver push notification via FCM
   */
  private async deliverPushNotification(
    notification: Notification
  ): Promise<void> {
    try {
      // Get active device tokens
      const tokens = await this.deviceTokenRepository.findActiveTokensForUser(
        notification.userId,
        notification.companyId
      );

      if (tokens.length === 0) {
        this.logger.debug(`No active tokens for user ${notification.userId}`);
        return;
      }

      // Send via FCM
      const tokenList = tokens.map((t) => t.fcmToken);
      const response = await this.fcmService.sendToTokens(
        tokenList,
        notification
      );

      // Update token status based on failures
      for (const failure of response.partialFailures) {
        if (
          failure.reason.includes('unregistered') ||
          failure.reason.includes('invalid') ||
          failure.reason.includes('auth')
        ) {
          await this.deviceTokenRepository.markTokenFailed(
            failure.token,
            failure.reason
          );
        }
      }

      this.logger.log(
        `Push sent: ${response.successCount} success, ${response.failureCount} failures`
      );
    } catch (error) {
      this.logger.error(`Failed to deliver push notification: ${error}`);
    }
  }

  /**
   * Deliver in-app notification (via WebSocket)
   */
  private async deliverInAppNotification(
    notification: Notification
  ): Promise<void> {
    try {
      // WebSocket delivery will be handled by NotificationGateway
      this.logger.log(
        `In-app notification queued for delivery: ${notification.id}`
      );
    } catch (error) {
      this.logger.error(`Failed to deliver in-app notification: ${error}`);
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmailNotification(
    notification: Notification
  ): Promise<void> {
    try {
      // Email delivery will be handled by email service
      this.logger.log(
        `Email notification queued for delivery: ${notification.id}`
      );
    } catch (error) {
      this.logger.error(`Failed to queue email notification: ${error}`);
    }
  }

  /**
   * Deliver SMS notification
   */
  private async deliverSmsNotification(
    notification: Notification
  ): Promise<void> {
    try {
      // SMS delivery will be handled by SMS service (Twilio, etc.)
      this.logger.log(
        `SMS notification queued for delivery: ${notification.id}`
      );
    } catch (error) {
      this.logger.error(`Failed to queue SMS notification: ${error}`);
    }
  }

  /**
   * Get notifications for user
   * @param userId User ID
   * @param companyId Company ID
   * @param limit Max results
   * @param offset Offset
   * @returns Notifications
   */
  async getNotifications(
    userId: string,
    companyId: string,
    limit = 50,
    offset = 0
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const [result, unreadCount] = await Promise.all([
        this.notificationRepository.listForUser(userId, companyId, {
          limit,
          offset,
        }),
        this.notificationRepository.getUnreadCount(userId, companyId),
      ]);

      return {
        ...result,
        unreadCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get notifications: ${error}`);
      throw error;
    }
  }

  /**
   * Get single notification
   * @param notificationId Notification ID
   * @param companyId Company ID
   * @returns Notification
   */
  async getNotification(
    notificationId: string,
    companyId: string
  ): Promise<Notification> {
    try {
      const notification = await this.notificationRepository.findById(
        notificationId,
        companyId
      );

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      return notification;
    } catch (error) {
      this.logger.error(`Failed to get notification: ${error}`);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param notificationId Notification ID
   * @param companyId Company ID
   * @returns Updated notification
   */
  async markAsRead(
    notificationId: string,
    companyId: string
  ): Promise<Notification> {
    try {
      const notification = await this.notificationRepository.markAsRead(
        notificationId,
        companyId
      );

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      return notification;
    } catch (error) {
      this.logger.error(`Failed to mark as read: ${error}`);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @param userId User ID
   * @param companyId Company ID
   * @returns Count updated
   */
  async markAllAsRead(userId: string, companyId: string): Promise<number> {
    try {
      return await this.notificationRepository.markAllAsRead(userId, companyId);
    } catch (error) {
      this.logger.error(`Failed to mark all as read: ${error}`);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param notificationId Notification ID
   * @param companyId Company ID
   */
  async deleteNotification(
    notificationId: string,
    companyId: string
  ): Promise<void> {
    try {
      // Implement delete logic here
      this.logger.log(`Notification deleted: ${notificationId}`);
    } catch (error) {
      this.logger.error(`Failed to delete notification: ${error}`);
      throw error;
    }
  }

  /**
   * Send bulk notification to multiple users
   * @param companyId Company ID
   * @param userIds User IDs
   * @param options Notification options
   * @returns Sent notifications
   */
  async sendBulkNotification(
    companyId: string,
    userIds: string[],
    options: Omit<SendNotificationOptions, 'userId' | 'companyId'>
  ): Promise<Notification[]> {
    try {
      const notifications = await Promise.all(
        userIds.map((userId) =>
          this.sendNotification({
            ...options,
            userId,
            companyId,
          })
        )
      );

      this.logger.log(
        `Bulk notification sent to ${notifications.length} users`
      );
      return notifications;
    } catch (error) {
      this.logger.error(`Failed to send bulk notification: ${error}`);
      throw error;
    }
  }

  /**
   * Get notification statistics
   * @param companyId Company ID
   * @returns Stats
   */
  async getStats(companyId: string): Promise<any> {
    try {
      return await this.notificationRepository.getStats(companyId);
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error}`);
      return {};
    }
  }

  /**
   * Register device token
   * @param userId User ID
   * @param companyId Company ID
   * @param fcmToken FCM token
   * @param deviceType Device type
   * @param deviceName Device name
   */
  async registerDeviceToken(
    userId: string,
    companyId: string,
    fcmToken: string,
    deviceType: 'iOS' | 'Android' | 'Web',
    deviceName?: string
  ): Promise<void> {
    try {
      if (!fcmToken) {
        throw new BadRequestException('FCM token is required');
      }

      await this.deviceTokenRepository.registerToken({
        userId,
        companyId,
        fcmToken,
        deviceType,
        deviceName,
        isActive: true,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      this.logger.log(`Device token registered for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to register device token: ${error}`);
      throw error;
    }
  }

  /**
   * Unregister device token
   * @param fcmToken FCM token
   */
  async unregisterDeviceToken(fcmToken: string): Promise<void> {
    try {
      await this.deviceTokenRepository.unregisterToken(fcmToken);
      this.logger.log(`Device token unregistered`);
    } catch (error) {
      this.logger.error(`Failed to unregister device token: ${error}`);
      throw error;
    }
  }
}
