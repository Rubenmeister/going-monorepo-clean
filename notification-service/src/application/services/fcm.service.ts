/**
 * Firebase Cloud Messaging Service
 * Handles push notification delivery via Firebase
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  FcmMessage,
  BatchSendResponse,
  Notification,
} from '../../domain/models/notification.model';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private messaging: admin.messaging.Messaging;

  constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (!serviceAccountPath) {
        this.logger.warn(
          'FIREBASE_SERVICE_ACCOUNT_PATH not set. FCM will not be available.'
        );
        return;
      }

      try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        this.messaging = admin.messaging();
        this.logger.log('Firebase Admin SDK initialized');
      } catch (error) {
        this.logger.error(`Failed to initialize Firebase: ${error}`);
      }
    } else {
      this.messaging = admin.messaging();
    }
  }

  /**
   * Send a single push notification
   * @param token FCM token
   * @param notification Notification data
   * @returns Message ID if successful
   */
  async sendToToken(
    token: string,
    notification: Notification
  ): Promise<string | null> {
    try {
      if (!this.messaging) {
        throw new BadRequestException('Firebase messaging not initialized');
      }

      const fcmMessage = this.buildFcmMessage(token, notification);
      const messageId = await this.messaging.send(fcmMessage as any);

      this.logger.debug(`Push notification sent: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error}`);
      return null;
    }
  }

  /**
   * Send notifications to multiple tokens
   * @param tokens Array of FCM tokens
   * @param notification Notification data
   * @returns Batch send response
   */
  async sendToTokens(
    tokens: string[],
    notification: Notification
  ): Promise<BatchSendResponse> {
    try {
      if (!this.messaging) {
        throw new BadRequestException('Firebase messaging not initialized');
      }

      if (tokens.length === 0) {
        return {
          successCount: 0,
          failureCount: 0,
          partialFailures: [],
        };
      }

      // Firebase allows max 500 tokens per request
      const batchSize = 500;
      const batches = [];

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        batches.push(batch);
      }

      let successCount = 0;
      let failureCount = 0;
      const partialFailures = [];

      for (const batch of batches) {
        const messages = batch.map((token) =>
          this.buildFcmMessage(token, notification)
        );

        try {
          const response = await this.messaging.sendAll(messages as any);

          successCount += response.successCount;
          failureCount += response.failureCount;

          // Process failures
          response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
              partialFailures.push({
                token: batch[idx],
                reason: resp.error.message,
              });
            }
          });
        } catch (error) {
          this.logger.error(`Batch send failed: ${error}`);
          failureCount += batch.length;
          batch.forEach((token) => {
            partialFailures.push({
              token,
              reason: error.message,
            });
          });
        }
      }

      this.logger.log(
        `Batch sent: ${successCount} success, ${failureCount} failures`
      );

      return {
        successCount,
        failureCount,
        partialFailures,
      };
    } catch (error) {
      this.logger.error(`Failed to send batch: ${error}`);
      return {
        successCount: 0,
        failureCount: tokens.length,
        partialFailures: tokens.map((token) => ({
          token,
          reason: error.message,
        })),
      };
    }
  }

  /**
   * Send to a topic
   * @param topic Topic name
   * @param notification Notification data
   * @returns Message ID if successful
   */
  async sendToTopic(
    topic: string,
    notification: Notification
  ): Promise<string | null> {
    try {
      if (!this.messaging) {
        throw new BadRequestException('Firebase messaging not initialized');
      }

      const fcmMessage: admin.messaging.Message = {
        notification: {
          title: notification.title,
          body: notification.message,
          imageUrl: notification.image,
        },
        data: this.buildDataPayload(notification),
        webpush: {
          notification: {
            title: notification.title,
            body: notification.message,
            icon: notification.icon || '/notification-icon.png',
            image: notification.image,
            badge: '/notification-badge.png',
            tag: notification.type,
            requireInteraction: notification.priority === 'URGENT',
          },
          fcmOptions: {
            link: notification.actionUrl,
          },
        },
        android: {
          priority: this.mapPriorityToAndroid(notification.priority),
          notification: {
            sound: 'default',
            clickAction: notification.actionUrl,
            color: '#FF6B6B',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.message,
              },
              badge: 1,
              sound: 'default',
              'mutable-content': true,
            },
          },
        },
        topic,
      };

      const messageId = await this.messaging.send(fcmMessage);
      this.logger.debug(`Topic notification sent to ${topic}: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Failed to send to topic: ${error}`);
      return null;
    }
  }

  /**
   * Subscribe token to topic
   * @param tokens Array of FCM tokens
   * @param topic Topic name
   * @returns Subscription response
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    try {
      if (!this.messaging) {
        throw new BadRequestException('Firebase messaging not initialized');
      }

      if (tokens.length === 0) {
        return true;
      }

      // Firebase allows max 1000 tokens per subscription
      const batchSize = 1000;

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        await this.messaging.subscribeToTopic(batch, topic);
      }

      this.logger.log(`Subscribed ${tokens.length} tokens to topic ${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic: ${error}`);
      return false;
    }
  }

  /**
   * Unsubscribe token from topic
   * @param tokens Array of FCM tokens
   * @param topic Topic name
   * @returns Unsubscription response
   */
  async unsubscribeFromTopic(
    tokens: string[],
    topic: string
  ): Promise<boolean> {
    try {
      if (!this.messaging) {
        throw new BadRequestException('Firebase messaging not initialized');
      }

      if (tokens.length === 0) {
        return true;
      }

      // Firebase allows max 1000 tokens per operation
      const batchSize = 1000;

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        await this.messaging.unsubscribeFromTopic(batch, topic);
      }

      this.logger.log(
        `Unsubscribed ${tokens.length} tokens from topic ${topic}`
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic: ${error}`);
      return false;
    }
  }

  /**
   * Build FCM message from notification
   */
  private buildFcmMessage(
    token: string,
    notification: Notification
  ): admin.messaging.Message {
    return {
      notification: {
        title: notification.title,
        body: notification.message,
        imageUrl: notification.image,
      },
      data: this.buildDataPayload(notification),
      webpush: {
        notification: {
          title: notification.title,
          body: notification.message,
          icon: notification.icon || '/notification-icon.png',
          image: notification.image,
          badge: '/notification-badge.png',
          tag: notification.type,
          requireInteraction: notification.priority === 'URGENT',
        },
        fcmOptions: {
          link: notification.actionUrl,
        },
      },
      android: {
        priority: this.mapPriorityToAndroid(notification.priority),
        ttl: this.calculateTtl(notification.priority),
        notification: {
          sound: 'default',
          clickAction: notification.actionUrl,
          color: '#FF6B6B',
          icon: notification.icon || 'ic_notification',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.message,
            },
            badge: 1,
            sound: 'default',
            'mutable-content': true,
          },
        },
      },
      token,
    };
  }

  /**
   * Build data payload from notification
   */
  private buildDataPayload(notification: Notification): Record<string, string> {
    const data: Record<string, string> = {
      notificationId: notification.id || '',
      type: notification.type,
      title: notification.title,
      message: notification.message,
    };

    if (notification.actionUrl) {
      data.actionUrl = notification.actionUrl;
    }

    if (notification.actionLabel) {
      data.actionLabel = notification.actionLabel;
    }

    if (notification.relatedEntity) {
      data.relatedEntityType = notification.relatedEntity.type;
      data.relatedEntityId = notification.relatedEntity.id;
    }

    // Add custom data fields
    if (notification.data) {
      Object.entries(notification.data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          data[key] = value;
        } else {
          data[key] = JSON.stringify(value);
        }
      });
    }

    return data;
  }

  /**
   * Map priority to Android priority
   */
  private mapPriorityToAndroid(priority: string): 'high' | 'normal' {
    return ['HIGH', 'URGENT'].includes(priority) ? 'high' : 'normal';
  }

  /**
   * Calculate TTL (Time To Live) in seconds
   */
  private calculateTtl(priority: string): number {
    switch (priority) {
      case 'URGENT':
        return 3600; // 1 hour
      case 'HIGH':
        return 86400; // 24 hours
      case 'NORMAL':
        return 604800; // 7 days
      case 'LOW':
        return 2592000; // 30 days
      default:
        return 604800;
    }
  }

  /**
   * Verify token is valid
   * @param token FCM token
   * @returns true if token is valid
   */
  async isTokenValid(token: string): Promise<boolean> {
    try {
      // Attempt to send a silent notification to verify token
      if (!this.messaging) {
        return false;
      }

      const message: admin.messaging.Message = {
        data: {
          test: 'true',
        },
        token,
      };

      await this.messaging.send(message);
      return true;
    } catch (error) {
      return false;
    }
  }
}
