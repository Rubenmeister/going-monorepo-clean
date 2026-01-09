import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import * as admin from 'firebase-admin';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';
import { PrismaService } from '@going-monorepo-clean/prisma-client';

@Injectable()
export class FcmPushGateway implements INotificationGateway {
  private app: admin.app.App | null = null;
  private readonly logger = new Logger(FcmPushGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

    if (projectId && privateKey && clientEmail) {
      try {
        // Check if Firebase is already initialized
        if (admin.apps.length === 0) {
          this.app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              privateKey: privateKey.replace(/\\n/g, '\n'),
              clientEmail,
            }),
          });
          this.logger.log('Firebase Admin SDK initialized successfully');
        } else {
          this.app = admin.apps[0] as admin.app.App;
          this.logger.log('Using existing Firebase Admin SDK instance');
        }
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK', error);
      }
    } else {
      this.logger.warn('Firebase credentials not configured - FCM gateway disabled');
    }
  }

  async send(notification: Notification): Promise<Result<void, Error>> {
    if (!this.app) {
      this.logger.warn('Firebase not configured, skipping push notification');
      return ok(undefined); // Graceful degradation - don't fail if FCM isn't configured
    }

    const primitives = notification.toPrimitives();
    const { userId, title, content, type, id } = primitives;

    try {
      // Look up device tokens for userId from database
      const deviceTokens = await this.getDeviceTokens(userId);

      if (deviceTokens.length === 0) {
        this.logger.debug(`No device tokens found for user ${userId}`);
        return ok(undefined);
      }

      const message: admin.messaging.MulticastMessage = {
        tokens: deviceTokens,
        notification: {
          title: title,
          body: content,
        },
        data: {
          notificationId: id,
          type: type,
          userId: userId,
          clickAction: this.getClickAction(type),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'going-notifications',
            icon: 'ic_notification',
            color: '#10B981', // Going brand green
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `FCM push sent to user ${userId}: ${response.successCount} success, ${response.failureCount} failure`,
      );

      // Handle failed tokens (remove invalid ones)
      await this.handleFailedTokens(deviceTokens, response);

      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to send FCM notification to user ${userId}`, error);
      return err(error as Error);
    }
  }

  /**
   * Get active device tokens for a user
   */
  private async getDeviceTokens(userId: string): Promise<string[]> {
    try {
      const tokens = await this.prisma.deviceToken.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          token: true,
        },
      });
      return tokens.map((t) => t.token);
    } catch (error) {
      this.logger.error(`Failed to fetch device tokens for user ${userId}`, error);
      return [];
    }
  }

  /**
   * Handle failed token responses - deactivate invalid tokens
   */
  private async handleFailedTokens(
    tokens: string[],
    response: admin.messaging.BatchResponse,
  ): Promise<void> {
    const invalidTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        // These error codes indicate the token is no longer valid
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      try {
        await this.prisma.deviceToken.updateMany({
          where: {
            token: { in: invalidTokens },
          },
          data: {
            isActive: false,
          },
        });
        this.logger.log(`Deactivated ${invalidTokens.length} invalid device tokens`);
      } catch (error) {
        this.logger.error('Failed to deactivate invalid device tokens', error);
      }
    }
  }

  /**
   * Get click action based on notification type
   */
  private getClickAction(type: string): string {
    const actionMap: Record<string, string> = {
      booking_confirmed: 'OPEN_BOOKING',
      booking_cancelled: 'OPEN_BOOKING',
      payment_received: 'OPEN_PAYMENTS',
      payment_failed: 'OPEN_PAYMENTS',
      parcel_status_update: 'OPEN_PARCEL',
      message_received: 'OPEN_CHAT',
      system_alert: 'OPEN_APP',
    };
    return actionMap[type] || 'OPEN_APP';
  }
}
