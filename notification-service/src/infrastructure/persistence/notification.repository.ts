/**
 * Notification Repository
 * Handles all database operations for notifications
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationSchema } from '../schemas/notification.schema';
import {
  Notification,
  NotificationStatus,
} from '../../domain/models/notification.model';

interface ListFilters {
  status?: NotificationStatus;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class NotificationRepository {
  private readonly logger = new Logger(NotificationRepository.name);

  constructor(
    @InjectModel(NotificationSchema.name)
    private readonly notificationModel: Model<NotificationSchema>
  ) {}

  /**
   * Create a new notification
   * @param notification Notification data to save
   * @returns Saved notification
   */
  async create(notification: Partial<Notification>): Promise<Notification> {
    try {
      const newNotification = new this.notificationModel(notification);
      const saved = await newNotification.save();
      this.logger.debug(`Notification created for user ${notification.userId}`);
      return saved.toObject() as Notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error}`);
      throw error;
    }
  }

  /**
   * Find notification by ID
   * @param notificationId Notification ID
   * @param companyId Company ID for scoping
   * @returns Notification or null
   */
  async findById(
    notificationId: string,
    companyId: string
  ): Promise<Notification | null> {
    try {
      return await this.notificationModel
        .findOne({ _id: notificationId, companyId })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find notification: ${error}`);
      return null;
    }
  }

  /**
   * List notifications for a user
   * @param userId User ID
   * @param companyId Company ID
   * @param filters Query filters
   * @returns Array of notifications and total count
   */
  async listForUser(
    userId: string,
    companyId: string,
    filters: ListFilters = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const query: any = { userId, companyId };

      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.createdAt.$lte = filters.endDate;
        }
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const [notifications, total] = await Promise.all([
        this.notificationModel
          .find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean()
          .exec(),
        this.notificationModel.countDocuments(query),
      ]);

      return {
        notifications: notifications as Notification[],
        total,
      };
    } catch (error) {
      this.logger.error(`Failed to list notifications: ${error}`);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Get unread notification count
   * @param userId User ID
   * @param companyId Company ID
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string, companyId: string): Promise<number> {
    try {
      return await this.notificationModel.countDocuments({
        userId,
        companyId,
        status: { $ne: 'READ' },
      });
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${error}`);
      return 0;
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
  ): Promise<Notification | null> {
    try {
      return await this.notificationModel
        .findOneAndUpdate(
          { _id: notificationId, companyId },
          { status: 'READ', readAt: new Date() },
          { new: true }
        )
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to mark as read: ${error}`);
      return null;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @param companyId Company ID
   * @returns Updated count
   */
  async markAllAsRead(userId: string, companyId: string): Promise<number> {
    try {
      const result = await this.notificationModel.updateMany(
        { userId, companyId, status: { $ne: 'READ' } },
        { status: 'READ', readAt: new Date() }
      );
      return result.modifiedCount;
    } catch (error) {
      this.logger.error(`Failed to mark all as read: ${error}`);
      return 0;
    }
  }

  /**
   * Update notification status
   * @param notificationId Notification ID
   * @param companyId Company ID
   * @param status New status
   * @returns Updated notification
   */
  async updateStatus(
    notificationId: string,
    companyId: string,
    status: NotificationStatus
  ): Promise<Notification | null> {
    try {
      const updateData: any = { status };

      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      } else if (status === 'SENT') {
        updateData.sentAt = new Date();
      }

      return await this.notificationModel
        .findOneAndUpdate({ _id: notificationId, companyId }, updateData, {
          new: true,
        })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to update status: ${error}`);
      return null;
    }
  }

  /**
   * Update delivery attempt count
   * @param notificationId Notification ID
   * @param companyId Company ID
   * @param failureReason Optional failure reason
   * @returns Updated notification
   */
  async incrementDeliveryAttempt(
    notificationId: string,
    companyId: string,
    failureReason?: string
  ): Promise<Notification | null> {
    try {
      const updateData: any = {
        $inc: { deliveryAttempts: 1 },
      };

      if (failureReason) {
        updateData.failureReason = failureReason;
      }

      return await this.notificationModel
        .findOneAndUpdate({ _id: notificationId, companyId }, updateData, {
          new: true,
        })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to increment delivery attempt: ${error}`);
      return null;
    }
  }

  /**
   * Find notifications pending delivery
   * @param companyId Company ID
   * @param limit Max results
   * @returns Array of pending notifications
   */
  async findPendingNotifications(
    companyId: string,
    limit = 100
  ): Promise<Notification[]> {
    try {
      return await this.notificationModel
        .find({
          companyId,
          status: 'PENDING',
          $expr: {
            $lt: ['$deliveryAttempts', '$maxDeliveryAttempts'],
          },
        })
        .sort({ createdAt: 1 })
        .limit(limit)
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find pending notifications: ${error}`);
      return [];
    }
  }

  /**
   * Find failed notifications for retry
   * @param companyId Company ID
   * @param limit Max results
   * @returns Array of failed notifications
   */
  async findFailedNotifications(
    companyId: string,
    limit = 50
  ): Promise<Notification[]> {
    try {
      return await this.notificationModel
        .find({
          companyId,
          status: 'FAILED',
          $expr: {
            $lt: ['$deliveryAttempts', '$maxDeliveryAttempts'],
          },
        })
        .sort({ updatedAt: 1 })
        .limit(limit)
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find failed notifications: ${error}`);
      return [];
    }
  }

  /**
   * Delete old notifications (data cleanup)
   * @param companyId Company ID
   * @param daysOld Delete notifications older than this
   * @returns Deleted count
   */
  async deleteOldNotifications(
    companyId: string,
    daysOld = 90
  ): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.notificationModel.deleteMany({
        companyId,
        createdAt: { $lt: cutoffDate },
        status: 'READ', // Only delete read notifications
      });

      this.logger.log(`Deleted ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete old notifications: ${error}`);
      return 0;
    }
  }

  /**
   * Get notification statistics
   * @param companyId Company ID
   * @returns Notification stats
   */
  async getStats(companyId: string): Promise<any> {
    try {
      const [totals, byStatus, byType, byChannel] = await Promise.all([
        this.notificationModel.countDocuments({ companyId }),
        this.notificationModel.aggregate([
          { $match: { companyId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        this.notificationModel.aggregate([
          { $match: { companyId } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        this.notificationModel.aggregate([
          { $match: { companyId } },
          { $unwind: '$channels' },
          { $group: { _id: '$channels', count: { $sum: 1 } } },
        ]),
      ]);

      const statusMap = byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const typeMap = byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const channelMap = byChannel.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const delivered = statusMap['DELIVERED'] || 0;
      const read = statusMap['READ'] || 0;
      const sent = statusMap['SENT'] || 0;

      return {
        total: totals,
        byStatus: statusMap,
        byType: typeMap,
        byChannel: channelMap,
        deliveryRate: totals > 0 ? ((delivered / totals) * 100).toFixed(2) : 0,
        readRate: totals > 0 ? ((read / totals) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error}`);
      return {};
    }
  }
}
