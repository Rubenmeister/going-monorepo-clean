import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationRepository,
  NotificationChannelType,
} from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  NotificationDocument,
  NotificationModelSchema,
} from './schemas/notification.schema';

@Injectable()
export class MongooseNotificationRepository implements INotificationRepository {
  constructor(
    @InjectModel(NotificationModelSchema.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  async save(notification: Notification): Promise<Result<void, Error>> {
    try {
      const primitives = notification.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(notification: Notification): Promise<Result<void, Error>> {
    try {
      const primitives = notification.toPrimitives();
      await this.model.updateOne({ id: notification.id }, { $set: primitives }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<Notification | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByUserId(userId: string): Promise<Result<Notification[], Error>> {
    try {
      const docs = await this.model
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(50) // Default limit
        .exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error((error as Error).message));
    }
  }
  
  async findPendingByChannel(channel: NotificationChannelType): Promise<Result<Notification[], Error>> {
    try {
      const docs = await this.model.find({ channel: channel, status: 'PENDING' }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error((error as Error).message));
    }
  }

  async getUnreadCount(userId: string): Promise<Result<number, Error>> {
    try {
      const count = await this.model.countDocuments({ userId, isRead: false }).exec();
      return ok(count);
    } catch (error) {
      return err(new Error((error as Error).message));
    }
  }

  async markAllAsRead(userId: string): Promise<Result<void, Error>> {
    try {
      await this.model.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
      ).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error((error as Error).message));
    }
  }

  private toDomain(doc: NotificationDocument): Notification {
    return Notification.fromPrimitives(doc.toObject() as any);
  }
}