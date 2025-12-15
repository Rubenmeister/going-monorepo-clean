import { Injectable } from '@nestjs/common';
import { PrismaService } from '@going-monorepo-clean/prisma-client';
import {
  Notification,
  INotificationRepository,
} from '@going-monorepo-clean/domains-notification-core';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(notification: Notification): Promise<Result<void, Error>> {
    try {
      const primitives = notification.toPrimitives();

      await this.prisma.notification.create({
        data: {
          id: primitives.id,
          userId: primitives.userId,
          type: primitives.type,
          title: primitives.title,
          content: primitives.content,
          isRead: primitives.isRead,
          createdAt: primitives.createdAt,
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to save notification: ${error.message}`));
    }
  }

  async findById(id: string): Promise<Result<Notification | null, Error>> {
    try {
      const record = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!record) {
        return ok(null);
      }

      return ok(this.toDomain(record));
    } catch (error) {
      return err(new Error(`Failed to find notification: ${error.message}`));
    }
  }

  async findByUserId(userId: string): Promise<Result<Notification[], Error>> {
    try {
      const records = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return ok(records.map((r) => this.toDomain(r)));
    } catch (error) {
      return err(
        new Error(`Failed to find notifications by user: ${error.message}`)
      );
    }
  }

  async update(notification: Notification): Promise<Result<void, Error>> {
    try {
      const primitives = notification.toPrimitives();

      await this.prisma.notification.update({
        where: { id: primitives.id },
        data: {
          isRead: primitives.isRead,
          updatedAt: new Date(),
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to update notification: ${error.message}`));
    }
  }

  async getUnreadCount(userId: string): Promise<Result<number, Error>> {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });

      return ok(count);
    } catch (error) {
      return err(new Error(`Failed to get unread count: ${error.message}`));
    }
  }

  async markAllAsRead(userId: string): Promise<Result<void, Error>> {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to mark all as read: ${error.message}`));
    }
  }

  private toDomain(record: any): Notification {
    return Notification.fromPrimitives({
      id: record.id,
      userId: record.userId,
      type: record.type,
      title: record.title,
      content: record.content,
      isRead: record.isRead,
      createdAt: record.createdAt,
    });
  }
}
