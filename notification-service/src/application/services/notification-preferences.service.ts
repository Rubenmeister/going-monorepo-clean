/**
 * Notification Preferences Service
 * Handles user notification preferences and settings
 */

import { Injectable, Logger } from '@nestjs/common';
import { NotificationPreferences } from '../../domain/models/notification.model';
import { NotificationPreferencesRepository } from '../../infrastructure/persistence/notification-preferences.repository';

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(
    private readonly preferencesRepository: NotificationPreferencesRepository
  ) {}

  /**
   * Get user preferences
   * @param userId User ID
   * @param companyId Company ID
   * @returns User preferences
   */
  async getPreferences(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    try {
      return await this.preferencesRepository.getOrCreate(userId, companyId);
    } catch (error) {
      this.logger.error(`Failed to get preferences: ${error}`);
      throw error;
    }
  }

  /**
   * Update preferences
   * @param userId User ID
   * @param companyId Company ID
   * @param updates Preferences to update
   * @returns Updated preferences
   */
  async updatePreferences(
    userId: string,
    companyId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const updated = await this.preferencesRepository.update(
        userId,
        companyId,
        updates
      );

      if (!updated) {
        // Create with defaults if not exists
        return await this.preferencesRepository.getOrCreate(userId, companyId);
      }

      this.logger.log(`Preferences updated for user ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update preferences: ${error}`);
      throw error;
    }
  }

  /**
   * Enable push notifications
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async enablePush(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.enableChannel(userId, companyId, 'PUSH');
  }

  /**
   * Disable push notifications
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async disablePush(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.disableChannel(userId, companyId, 'PUSH');
  }

  /**
   * Enable email notifications
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async enableEmail(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.enableChannel(userId, companyId, 'EMAIL');
  }

  /**
   * Disable email notifications
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async disableEmail(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.disableChannel(
      userId,
      companyId,
      'EMAIL'
    );
  }

  /**
   * Enable SMS notifications
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async enableSms(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.enableChannel(userId, companyId, 'SMS');
  }

  /**
   * Disable SMS notifications
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async disableSms(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.disableChannel(userId, companyId, 'SMS');
  }

  /**
   * Enable in-app notifications
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async enableInApp(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.enableChannel(
      userId,
      companyId,
      'IN_APP'
    );
  }

  /**
   * Disable in-app notifications
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async disableInApp(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.disableChannel(
      userId,
      companyId,
      'IN_APP'
    );
  }

  /**
   * Unsubscribe from notification type
   * @param userId User ID
   * @param companyId Company ID
   * @param notificationType Notification type
   * @returns Updated preferences
   */
  async unsubscribeFromType(
    userId: string,
    companyId: string,
    notificationType: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.unsubscribeFromType(
      userId,
      companyId,
      notificationType
    );
  }

  /**
   * Subscribe to notification type
   * @param userId User ID
   * @param companyId Company ID
   * @param notificationType Notification type
   * @returns Updated preferences
   */
  async subscribeToType(
    userId: string,
    companyId: string,
    notificationType: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.subscribeToType(
      userId,
      companyId,
      notificationType
    );
  }

  /**
   * Set quiet hours
   * @param userId User ID
   * @param companyId Company ID
   * @param start Start time (HH:mm)
   * @param end End time (HH:mm)
   * @param enabled Whether to enable
   * @returns Updated preferences
   */
  async setQuietHours(
    userId: string,
    companyId: string,
    start: string,
    end: string,
    enabled: boolean
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.setQuietHours(
      userId,
      companyId,
      start,
      end,
      enabled
    );
  }

  /**
   * Enable do-not-disturb
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async enableDoNotDisturb(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.update(userId, companyId, {
      doNotDisturb: true,
    });
  }

  /**
   * Disable do-not-disturb
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated preferences
   */
  async disableDoNotDisturb(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    return this.preferencesRepository.update(userId, companyId, {
      doNotDisturb: false,
    });
  }

  /**
   * Check if channel is enabled
   * @param userId User ID
   * @param companyId Company ID
   * @param channel Channel name
   * @returns true if enabled
   */
  async isChannelEnabled(
    userId: string,
    companyId: string,
    channel: string
  ): Promise<boolean> {
    return this.preferencesRepository.isChannelEnabled(
      userId,
      companyId,
      channel
    );
  }

  /**
   * Check if notification type is enabled
   * @param userId User ID
   * @param companyId Company ID
   * @param notificationType Notification type
   * @returns true if enabled
   */
  async isTypeEnabled(
    userId: string,
    companyId: string,
    notificationType: string
  ): Promise<boolean> {
    return this.preferencesRepository.isTypeEnabled(
      userId,
      companyId,
      notificationType
    );
  }

  /**
   * Get enabled channels
   * @param userId User ID
   * @param companyId Company ID
   * @returns Array of enabled channels
   */
  async getEnabledChannels(
    userId: string,
    companyId: string
  ): Promise<string[]> {
    return this.preferencesRepository.getEnabledChannels(userId, companyId);
  }

  /**
   * Check if user is in quiet hours
   * @param userId User ID
   * @param companyId Company ID
   * @returns true if in quiet hours
   */
  async isInQuietHours(userId: string, companyId: string): Promise<boolean> {
    return this.preferencesRepository.isInQuietHours(userId, companyId);
  }

  /**
   * Delete preferences
   * @param userId User ID
   * @param companyId Company ID
   */
  async deletePreferences(userId: string, companyId: string): Promise<void> {
    try {
      await this.preferencesRepository.delete(userId, companyId);
      this.logger.log(`Preferences deleted for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete preferences: ${error}`);
      throw error;
    }
  }
}
