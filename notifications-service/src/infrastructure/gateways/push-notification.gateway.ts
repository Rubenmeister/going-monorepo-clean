import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';
import { DeviceTokenRepository } from '../persistence/device-token.repository';

/**
 * Firebase Cloud Messaging (FCM) Push Notification Gateway
 * Handles sending push notifications to Android/iOS devices via FCM
 */
@Injectable()
export class FirebasePushNotificationGateway
  implements INotificationGateway, OnModuleInit
{
  private readonly logger = new Logger(FirebasePushNotificationGateway.name);
  private messaging: any; // firebase-admin messaging instance

  constructor(private readonly deviceTokenRepo: DeviceTokenRepository) {}

  onModuleInit() {
    try {
      // Initialize Firebase Admin SDK when module loads
      // This assumes GOOGLE_APPLICATION_CREDENTIALS env variable is set
      // In production, load credentials from config service
      const admin = require('firebase-admin');

      if (!admin.apps.length) {
        this.logger.warn(
          'Firebase Admin SDK not initialized - using mock mode'
        );
        this.messaging = null;
      } else {
        this.messaging = admin.messaging();
        this.logger.log('Firebase Admin SDK initialized successfully');
      }
    } catch (error) {
      this.logger.warn(
        `Firebase Admin SDK initialization failed: ${error.message}`
      );
      this.messaging = null;
    }
  }

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props = notification.toPrimitives();

    this.logger.log(`[FCM] Sending notification to userId=${props.userId}`);
    this.logger.debug(`  Title: ${props.title}`);
    this.logger.debug(`  Body: ${props.body}`);

    // If Firebase is not initialized, use mock mode
    if (!this.messaging) {
      this.logger.warn(`[FCM MOCK] Would send: ${props.title} - ${props.body}`);
      return ok(undefined);
    }

    try {
      // Get device tokens for user (in production, query from database)
      const deviceTokens = await this.getDeviceTokensForUser(props.userId);

      if (deviceTokens.length === 0) {
        this.logger.warn(`No device tokens found for user ${props.userId}`);
        return ok(undefined);
      }

      // Send multicast message to all devices
      const message = {
        notification: {
          title: props.title,
          body: props.body,
          imageUrl: props.imageUrl,
        },
        data: {
          rideId: props.data?.rideId || '',
          actionUrl: props.data?.actionUrl || '',
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: 'high',
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            sound: 'default',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              alert: {
                title: props.title,
                body: props.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Send to all device tokens with batch processing
      const results = await this.sendBatch(deviceTokens, message);

      // Log results and cleanup invalid tokens
      await this.handleSendResults(results, deviceTokens, props.userId);

      this.logger.log(
        `[FCM] Sent to ${results.successCount}/${deviceTokens.length} devices`
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(`[FCM] Failed to send notification: ${error.message}`);
      return err(new Error(`FCM send failed: ${error.message}`));
    }
  }

  private async sendBatch(deviceTokens: string[], message: any): Promise<any> {
    if (!this.messaging) {
      return { successCount: deviceTokens.length, failureCount: 0 };
    }

    try {
      // Firebase sendAll supports up to 500 tokens
      const response = await this.messaging.sendAll(
        deviceTokens.map((token) => ({
          ...message,
          token,
        }))
      );
      return response;
    } catch (error) {
      this.logger.error(`Batch send error: ${error.message}`);
      throw error;
    }
  }

  private async handleSendResults(
    results: any,
    deviceTokens: string[],
    userId: string
  ): Promise<void> {
    // In production, clean up invalid tokens from database
    if (results.failureCount > 0) {
      const failedTokens = results.responses
        .map((resp: any, idx: number) =>
          resp.error ? deviceTokens[idx] : null
        )
        .filter((t: string | null) => t !== null);

      this.logger.warn(
        `[FCM] ${failedTokens.length} invalid tokens for user ${userId}`
      );
      await this.deviceTokenRepo.deactivateTokens(failedTokens);
    }
  }

  private async getDeviceTokensForUser(userId: string): Promise<string[]> {
    return this.deviceTokenRepo.findActiveByUserId(userId);
  }
}
