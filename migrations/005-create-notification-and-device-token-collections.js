/**
 * Migration: Create Extended Notification & Device Token Collections
 * Phase 5: Messaging & Chat System
 *
 * Creates:
 * 1. Extended notifications collection for push notifications
 * 2. Device tokens collection for managing user devices
 */

module.exports = {
  async up(db) {
    console.log('🚀 Creating notifications_extended collection...');

    // Create extended notifications collection
    await db.createCollection('notifications_extended', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'notificationId',
            'userId',
            'type',
            'title',
            'body',
            'status',
            'retries',
            'createdAt',
          ],
          properties: {
            notificationId: {
              bsonType: 'string',
              description: 'Unique notification ID (UUID)',
            },
            userId: {
              bsonType: 'string',
              description: 'Recipient user ID',
            },
            type: {
              bsonType: 'string',
              enum: [
                'RIDE_MATCH',
                'MESSAGE',
                'STATUS_UPDATE',
                'RATE_REMINDER',
                'ALERT',
              ],
              description: 'Notification type',
            },
            title: {
              bsonType: 'string',
              description: 'Notification title',
            },
            body: {
              bsonType: 'string',
              description: 'Notification message body',
            },
            imageUrl: {
              bsonType: 'string',
              description: 'Optional image URL',
            },
            data: {
              bsonType: 'object',
              description: 'Custom data payload',
              properties: {
                rideId: { bsonType: 'string' },
                driverId: { bsonType: 'string' },
                actionUrl: { bsonType: 'string' },
                customData: { bsonType: 'object' },
              },
            },
            deviceTokens: {
              bsonType: 'array',
              description: 'Device tokens to send notification to',
              items: {
                bsonType: 'object',
                properties: {
                  platform: {
                    bsonType: 'string',
                    enum: ['ios', 'android', 'web'],
                  },
                  token: { bsonType: 'string' },
                  isValid: { bsonType: 'bool' },
                  lastSentAt: { bsonType: 'date' },
                },
              },
            },
            status: {
              bsonType: 'string',
              enum: ['PENDING', 'SENT', 'FAILED', 'READ'],
              description: 'Notification delivery status',
            },
            sentAt: {
              bsonType: 'date',
              description: 'When notification was sent',
            },
            readAt: {
              bsonType: 'date',
              description: 'When user read the notification',
            },
            failureReason: {
              bsonType: 'string',
              description: 'Reason for delivery failure',
            },
            retries: {
              bsonType: 'int',
              description: 'Number of delivery attempts',
              minimum: 0,
            },
            createdAt: {
              bsonType: 'date',
              description: 'Creation timestamp',
            },
            expiresAt: {
              bsonType: 'date',
              description: 'Auto-delete timestamp (7 days)',
            },
          },
        },
      },
    });

    const notifCollection = db.collection('notifications_extended');
    await notifCollection.createIndex({ notificationId: 1 }, { unique: true });
    await notifCollection.createIndex({ userId: 1, createdAt: -1 });
    await notifCollection.createIndex({ status: 1 });
    await notifCollection.createIndex({ type: 1 });
    await notifCollection.createIndex({ userId: 1, status: 1 });
    await notifCollection.createIndex({
      'deviceTokens.token': 1,
      'deviceTokens.isValid': 1,
    });
    await notifCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );

    console.log('✅ Notifications extended collection created with 7 indexes');

    console.log('🚀 Creating device_tokens collection...');

    // Create device tokens collection
    await db.createCollection('device_tokens', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'id',
            'userId',
            'platform',
            'token',
            'status',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            id: {
              bsonType: 'string',
              description: 'Unique device token ID (UUID)',
            },
            userId: {
              bsonType: 'string',
              description: 'Owner user ID',
            },
            platform: {
              bsonType: 'string',
              enum: ['ios', 'android', 'web'],
              description: 'Device platform',
            },
            token: {
              bsonType: 'string',
              description: 'Push notification token from FCM/APNS',
            },
            status: {
              bsonType: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'INVALID'],
              description: 'Token status',
            },
            deviceName: {
              bsonType: 'string',
              description: 'Device model name (e.g., iPhone 14 Pro)',
            },
            osVersion: {
              bsonType: 'string',
              description: 'Operating system version',
            },
            appVersion: {
              bsonType: 'string',
              description: 'App version',
            },
            createdAt: {
              bsonType: 'date',
              description: 'Registration timestamp',
            },
            updatedAt: {
              bsonType: 'date',
              description: 'Last update timestamp',
            },
            lastUsedAt: {
              bsonType: 'date',
              description: 'Last time token was used',
            },
            disabledReason: {
              bsonType: 'string',
              description: 'Reason for disabling token',
            },
          },
        },
      },
    });

    const tokenCollection = db.collection('device_tokens');
    await tokenCollection.createIndex({ id: 1 }, { unique: true });
    await tokenCollection.createIndex({ token: 1 }, { unique: true });
    await tokenCollection.createIndex({ userId: 1, platform: 1 });
    await tokenCollection.createIndex({ userId: 1, status: 1 });
    await tokenCollection.createIndex({ status: 1 });
    await tokenCollection.createIndex({ createdAt: 1 });
    await tokenCollection.createIndex({ lastUsedAt: 1 });

    console.log('✅ Device tokens collection created with 7 indexes');
  },

  async down(db) {
    console.log('🔄 Dropping collections...');
    await db.dropCollection('notifications_extended');
    await db.dropCollection('device_tokens');
    console.log('✅ Collections dropped');
  },
};
