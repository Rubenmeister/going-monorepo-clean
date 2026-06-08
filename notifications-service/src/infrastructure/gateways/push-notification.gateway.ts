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
      const admin = require('firebase-admin');

      // Ya inicializado (otro módulo) → reutiliza.
      if (admin.apps.length) {
        this.messaging = admin.messaging();
        this.logger.log('Firebase Admin SDK ya inicializado — reutilizando');
        return;
      }

      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.GCP_PROJECT_ID ||
        'going-5d1ae';

      // 1) Service account explícito (secreto FIREBASE_SERVICE_ACCOUNT, JSON).
      const saJson =
        process.env.FIREBASE_SERVICE_ACCOUNT ||
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (saJson) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(saJson)),
          projectId,
        });
        this.messaging = admin.messaging();
        this.logger.log('Firebase Admin SDK inicializado (service account)');
        return;
      }

      // 2) Application Default Credentials (service account de Cloud Run).
      //    Funciona si la SA tiene permiso de FCM en el proyecto Firebase.
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
        });
        this.messaging = admin.messaging();
        this.logger.log('Firebase Admin SDK inicializado (ADC)');
        return;
      } catch (adcErr: any) {
        this.logger.warn(
          `Sin credenciales Firebase (ADC falló: ${adcErr?.message}) — modo mock`,
        );
        this.messaging = null;
      }
    } catch (error: any) {
      this.logger.warn(
        `Firebase Admin SDK init falló: ${error?.message} — modo mock`,
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
      // firebase-admin v12: sendAll() fue removido → sendEach() (hasta 500 msgs).
      const response = await this.messaging.sendEach(
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
