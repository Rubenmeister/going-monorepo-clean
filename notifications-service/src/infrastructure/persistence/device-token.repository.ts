import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DeviceToken,
  DeviceTokenDocument,
} from '../schemas/device-token.schema';

/**
 * DeviceTokenRepository
 * Stores and retrieves FCM/APNs device tokens per user.
 * Used by FirebasePushNotificationGateway to send push notifications.
 */
@Injectable()
export class DeviceTokenRepository {
  private readonly logger = new Logger(DeviceTokenRepository.name);

  constructor(
    @InjectModel(DeviceToken.name)
    private readonly model: Model<DeviceTokenDocument>
  ) {}

  /** Register or refresh a device token for a user */
  async upsert(
    userId: string,
    token: string,
    platform: 'android' | 'ios' | 'web' = 'android',
    deviceId?: string
  ): Promise<void> {
    await this.model.findOneAndUpdate(
      { token },
      { userId, token, platform, isActive: true, deviceId },
      { upsert: true, new: true }
    );
    this.logger.debug(`Upserted device token for user ${userId}`);
  }

  /** Get all active tokens for a user (across devices) */
  async findActiveByUserId(userId: string): Promise<string[]> {
    const docs = await this.model
      .find({ userId, isActive: true })
      .select('token')
      .lean();
    return docs.map((d) => d.token);
  }

  /** Mark specific tokens as inactive (FCM invalid-token cleanup) */
  async deactivateTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.model.updateMany(
      { token: { $in: tokens } },
      { $set: { isActive: false } }
    );
    this.logger.debug(`Deactivated ${tokens.length} invalid tokens`);
  }

  /** Remove all tokens for a user on logout */
  async deleteByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ userId });
  }
}
