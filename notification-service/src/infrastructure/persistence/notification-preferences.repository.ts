/**
 * Notification Preferences Repository
 * Manages user notification preferences and settings
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationPreferencesSchema } from '../schemas/notification-preferences.schema';
import { NotificationPreferences } from '../../domain/models/notification.model';

@Injectable()
export class NotificationPreferencesRepository {
  private readonly logger = new Logger(NotificationPreferencesRepository.name);

  constructor(
    @InjectModel(NotificationPreferencesSchema.name)
    private readonly preferencesModel: Model<NotificationPreferencesSchema>
  ) {}

  /**
   * Get or create user preferences
   * @param userId User ID
   * @param companyId Company ID
   * @returns User preferences
   */
  async getOrCreate(
    userId: string,
    companyId: string
  ): Promise<NotificationPreferences> {
    try {
      let preferences = await this.preferencesModel.findOne({
        userId,
        companyId,
      });

      if (!preferences) {
        // Create default preferences
        preferences = new this.preferencesModel({
          userId,
          companyId,
          enablePush: true,
          enableEmail: true,
          enableSms: false,
          enableInApp: true,
          quietHoursEnabled: false,
          doNotDisturb: false,
          unsubscribedTypes: [],
          unsubscribedChannels: [],
        });
        await preferences.save();
        this.logger.debug(`Default preferences created for user ${userId}`);
      }

      return preferences.toObject() as NotificationPreferences;
    } catch (error) {
      this.logger.error(`Failed to get or create preferences: ${error}`);
      throw error;
    }
  }

  /**
   * Update user preferences
   * @param userId User ID
   * @param companyId Company ID
   * @param updates Preferences to update
   * @returns Updated preferences
   */
  async update(
    userId: string,
    companyId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> {
    try {
      return await this.preferencesModel
        .findOneAndUpdate(
          { userId, companyId },
          { ...updates, updatedAt: new Date() },
          { new: true, upsert: true }
        )
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to update preferences: ${error}`);
      return null;
    }
  }

  /**
   * Enable a notification channel
   * @param userId User ID
   * @param companyId Company ID
   * @param channel Channel to enable
   * @returns Updated preferences
   */
  async enableChannel(
    userId: string,
    companyId: string,
    channel: string
  ): Promise<NotificationPreferences | null> {
    try {
      const updateData: any = {};
      updateData[`enable${this.capitalizeChannel(channel)}`] = true;
      updateData.$pull = { unsubscribedChannels: channel };

      return await this.preferencesModel
        .findOneAndUpdate({ userId, companyId }, updateData, { new: true })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to enable channel: ${error}`);
      return null;
    }
  }

  /**
   * Disable a notification channel
   * @param userId User ID
   * @param companyId Company ID
   * @param channel Channel to disable
   * @returns Updated preferences
   */
  async disableChannel(
    userId: string,
    companyId: string,
    channel: string
  ): Promise<NotificationPreferences | null> {
    try {
      const updateData: any = {};
      updateData[`enable${this.capitalizeChannel(channel)}`] = false;
      updateData.$addToSet = { unsubscribedChannels: channel };

      return await this.preferencesModel
        .findOneAndUpdate({ userId, companyId }, updateData, { new: true })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to disable channel: ${error}`);
      return null;
    }
  }

  /**
   * Unsubscribe from a notification type
   * @param userId User ID
   * @param companyId Company ID
   * @param notificationType Notification type to unsubscribe
   * @returns Updated preferences
   */
  async unsubscribeFromType(
    userId: string,
    companyId: string,
    notificationType: string
  ): Promise<NotificationPreferences | null> {
    try {
      return await this.preferencesModel
        .findOneAndUpdate(
          { userId, companyId },
          { $addToSet: { unsubscribedTypes: notificationType } },
          { new: true }
        )
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to unsubscribe: ${error}`);
      return null;
    }
  }

  /**
   * Subscribe to a notification type
   * @param userId User ID
   * @param companyId Company ID
   * @param notificationType Notification type to subscribe
   * @returns Updated preferences
   */
  async subscribeToType(
    userId: string,
    companyId: string,
    notificationType: string
  ): Promise<NotificationPreferences | null> {
    try {
      return await this.preferencesModel
        .findOneAndUpdate(
          { userId, companyId },
          { $pull: { unsubscribedTypes: notificationType } },
          { new: true }
        )
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to subscribe: ${error}`);
      return null;
    }
  }

  /**
   * Set quiet hours
   * @param userId User ID
   * @param companyId Company ID
   * @param start Start time (HH:mm)
   * @param end End time (HH:mm)
   * @param enabled Whether to enable quiet hours
   * @returns Updated preferences
   */
  async setQuietHours(
    userId: string,
    companyId: string,
    start: string,
    end: string,
    enabled: boolean
  ): Promise<NotificationPreferences | null> {
    try {
      return await this.preferencesModel
        .findOneAndUpdate(
          { userId, companyId },
          {
            quietHoursStart: start,
            quietHoursEnd: end,
            quietHoursEnabled: enabled,
            updatedAt: new Date(),
          },
          { new: true }
        )
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to set quiet hours: ${error}`);
      return null;
    }
  }

  /**
   * Check if user is in quiet hours
   * @param userId User ID
   * @param companyId Company ID
   * @returns true if currently in quiet hours
   */
  async isInQuietHours(userId: string, companyId: string): Promise<boolean> {
    try {
      const prefs = await this.preferencesModel.findOne({ userId, companyId });

      if (!prefs || !prefs.quietHoursEnabled) {
        return false;
      }

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      return (
        currentTime >= prefs.quietHoursStart &&
        currentTime <= prefs.quietHoursEnd
      );
    } catch (error) {
      this.logger.error(`Failed to check quiet hours: ${error}`);
      return false;
    }
  }

  /**
   * Check if notification type is enabled for user
   * @param userId User ID
   * @param companyId Company ID
   * @param notificationType Notification type
   * @returns true if type is enabled
   */
  async isTypeEnabled(
    userId: string,
    companyId: string,
    notificationType: string
  ): Promise<boolean> {
    try {
      const prefs = await this.preferencesModel.findOne(
        { userId, companyId },
        { unsubscribedTypes: 1 }
      );

      if (!prefs) {
        return true; // Default to enabled
      }

      return !prefs.unsubscribedTypes.includes(notificationType);
    } catch (error) {
      this.logger.error(`Failed to check if type is enabled: ${error}`);
      return true;
    }
  }

  /**
   * Check if channel is enabled for user
   * @param userId User ID
   * @param companyId Company ID
   * @param channel Channel
   * @returns true if channel is enabled
   */
  async isChannelEnabled(
    userId: string,
    companyId: string,
    channel: string
  ): Promise<boolean> {
    try {
      const fieldName = `enable${this.capitalizeChannel(channel)}`;
      const prefs = await this.preferencesModel.findOne(
        { userId, companyId },
        { [fieldName]: 1 }
      );

      if (!prefs) {
        return true; // Default to enabled
      }

      return prefs[fieldName] ?? true;
    } catch (error) {
      this.logger.error(`Failed to check if channel is enabled: ${error}`);
      return true;
    }
  }

  /**
   * Get enabled channels for user
   * @param userId User ID
   * @param companyId Company ID
   * @returns Array of enabled channels
   */
  async getEnabledChannels(
    userId: string,
    companyId: string
  ): Promise<string[]> {
    try {
      const prefs = await this.getOrCreate(userId, companyId);
      const channels = [];

      if (prefs.enablePush) channels.push('PUSH');
      if (prefs.enableEmail) channels.push('EMAIL');
      if (prefs.enableSms) channels.push('SMS');
      if (prefs.enableInApp) channels.push('IN_APP');

      return channels;
    } catch (error) {
      this.logger.error(`Failed to get enabled channels: ${error}`);
      return ['PUSH', 'EMAIL', 'IN_APP']; // Default channels
    }
  }

  /**
   * Delete user preferences
   * @param userId User ID
   * @param companyId Company ID
   * @returns true if deleted
   */
  async delete(userId: string, companyId: string): Promise<boolean> {
    try {
      const result = await this.preferencesModel.deleteOne({
        userId,
        companyId,
      });
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error(`Failed to delete preferences: ${error}`);
      return false;
    }
  }

  /**
   * Helper: Capitalize channel name
   */
  private capitalizeChannel(channel: string): string {
    return channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase();
  }
}
