import { Injectable, Logger } from '@nestjs/common';
import { Result, ok } from 'neverthrow';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

/**
 * Push Notification Gateway
 * TODO: Replace stub with real provider (Firebase FCM, Apple APNs, etc.)
 *
 * Example integration with Firebase FCM:
 *   npm install firebase-admin
 *   const admin = require('firebase-admin');
 *   admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
 *   await admin.messaging().send({ token: deviceToken, notification: { title, body } });
 */
@Injectable()
export class PushNotificationGateway implements INotificationGateway {
  private readonly logger = new Logger(PushNotificationGateway.name);

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props = notification.toPrimitives();

    this.logger.log(`[PUSH] Sending to userId=${props.userId}`);
    this.logger.log(`  Title: ${props.title}`);
    this.logger.log(`  Body: ${props.body}`);

    // TODO: Integrate real push notification provider here
    // e.g. Firebase FCM, Apple APNs, OneSignal

    return ok(undefined);
  }
}
