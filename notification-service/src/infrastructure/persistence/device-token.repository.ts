/**
 * Device Token Repository
 * Manages Firebase Cloud Messaging tokens for push notifications
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceTokenSchema } from '../schemas/device-token.schema';
import { DeviceToken } from '../../domain/models/notification.model';

@Injectable()
export class DeviceTokenRepository {
  private readonly logger = new Logger(DeviceTokenRepository.name);

  constructor(
    @InjectModel(DeviceTokenSchema.name)
    private readonly deviceTokenModel: Model<DeviceTokenSchema>
  ) {}

  /**
   * Register or update a device token
   * @param deviceToken Device token data
   * @returns Saved device token
   */
  async registerToken(deviceToken: Partial<DeviceToken>): Promise<DeviceToken> {
    try {
      const existing = await this.deviceTokenModel.findOne({
        fcmToken: deviceToken.fcmToken,
      });

      if (existing) {
        // Update existing token
        const updated = await this.deviceTokenModel.findOneAndUpdate(
          { fcmToken: deviceToken.fcmToken },
          {
            ...deviceToken,
            isActive: true,
            lastUsedAt: new Date(),
            failureCount: 0,
            lastErrorAt: null,
            lastErrorMessage: null,
          },
          { new: true }
        );
        this.logger.debug(
          `Device token updated for user ${deviceToken.userId}`
        );
        return updated.toObject() as DeviceToken;
      }

      // Create new token
      const newToken = new this.deviceTokenModel({
        ...deviceToken,
        isActive: true,
        lastUsedAt: new Date(),
      });
      const saved = await newToken.save();
      this.logger.debug(
        `Device token registered for user ${deviceToken.userId}`
      );
      return saved.toObject() as DeviceToken;
    } catch (error) {
      this.logger.error(`Failed to register device token: ${error}`);
      throw error;
    }
  }

  /**
   * Find all active tokens for a user
   * @param userId User ID
   * @param companyId Company ID
   * @returns Array of device tokens
   */
  async findActiveTokensForUser(
    userId: string,
    companyId: string
  ): Promise<DeviceToken[]> {
    try {
      return await this.deviceTokenModel
        .find({ userId, companyId, isActive: true })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find tokens for user: ${error}`);
      return [];
    }
  }

  /**
   * Find all active tokens for a company
   * @param companyId Company ID
   * @param limit Max results
   * @returns Array of device tokens
   */
  async findActiveTokensForCompany(
    companyId: string,
    limit = 1000
  ): Promise<DeviceToken[]> {
    try {
      return await this.deviceTokenModel
        .find({ companyId, isActive: true })
        .limit(limit)
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find tokens for company: ${error}`);
      return [];
    }
  }

  /**
   * Mark token as failed
   * @param fcmToken FCM token
   * @param errorMessage Error message
   * @returns Updated device token
   */
  async markTokenFailed(
    fcmToken: string,
    errorMessage?: string
  ): Promise<DeviceToken | null> {
    try {
      const updateData: any = {
        $inc: { failureCount: 1 },
        lastErrorAt: new Date(),
      };

      if (errorMessage) {
        updateData.lastErrorMessage = errorMessage;
      }

      // Mark as inactive after 5 failures
      const updated = await this.deviceTokenModel.findOneAndUpdate(
        { fcmToken },
        updateData,
        { new: true }
      );

      if (updated && updated.failureCount >= 5) {
        await this.deviceTokenModel.updateOne(
          { fcmToken },
          { isActive: false }
        );
        this.logger.warn(
          `Device token deactivated after multiple failures: ${fcmToken}`
        );
      }

      return updated?.toObject() as DeviceToken;
    } catch (error) {
      this.logger.error(`Failed to mark token as failed: ${error}`);
      return null;
    }
  }

  /**
   * Mark token as successfully used
   * @param fcmToken FCM token
   * @returns Updated device token
   */
  async markTokenSuccessful(fcmToken: string): Promise<DeviceToken | null> {
    try {
      return await this.deviceTokenModel
        .findOneAndUpdate(
          { fcmToken },
          {
            lastUsedAt: new Date(),
            failureCount: 0,
            lastErrorAt: null,
            lastErrorMessage: null,
          },
          { new: true }
        )
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to mark token as successful: ${error}`);
      return null;
    }
  }

  /**
   * Unregister/delete a device token
   * @param fcmToken FCM token
   * @returns true if deleted, false otherwise
   */
  async unregisterToken(fcmToken: string): Promise<boolean> {
    try {
      const result = await this.deviceTokenModel.deleteOne({ fcmToken });
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error(`Failed to unregister token: ${error}`);
      return false;
    }
  }

  /**
   * Get all tokens for a list of users
   * @param userIds Array of user IDs
   * @param companyId Company ID
   * @returns Array of device tokens
   */
  async findTokensForUsers(
    userIds: string[],
    companyId: string
  ): Promise<DeviceToken[]> {
    try {
      return await this.deviceTokenModel
        .find({ userId: { $in: userIds }, companyId, isActive: true })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find tokens for users: ${error}`);
      return [];
    }
  }

  /**
   * Count active devices per user
   * @param userId User ID
   * @param companyId Company ID
   * @returns Count of active devices
   */
  async countActiveDevices(userId: string, companyId: string): Promise<number> {
    try {
      return await this.deviceTokenModel.countDocuments({
        userId,
        companyId,
        isActive: true,
      });
    } catch (error) {
      this.logger.error(`Failed to count active devices: ${error}`);
      return 0;
    }
  }

  /**
   * Clean up inactive and failed tokens
   * @param companyId Company ID
   * @param daysInactive Delete tokens inactive for this many days
   * @returns Deleted count
   */
  async cleanupInactiveTokens(
    companyId: string,
    daysInactive = 30
  ): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      const result = await this.deviceTokenModel.deleteMany({
        companyId,
        isActive: false,
        lastUsedAt: { $lt: cutoffDate },
      });

      this.logger.log(`Cleaned up ${result.deletedCount} inactive tokens`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup inactive tokens: ${error}`);
      return 0;
    }
  }

  /**
   * Get device token statistics
   * @param companyId Company ID
   * @returns Token stats
   */
  async getStats(companyId: string): Promise<any> {
    try {
      const total = await this.deviceTokenModel.countDocuments({ companyId });
      const active = await this.deviceTokenModel.countDocuments({
        companyId,
        isActive: true,
      });
      const byType = await this.deviceTokenModel.aggregate([
        { $match: { companyId } },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      ]);

      const typeMap = byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      return {
        total,
        active,
        inactive: total - active,
        byType: typeMap,
        activeRate: total > 0 ? ((active / total) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error}`);
      return {};
    }
  }
}
