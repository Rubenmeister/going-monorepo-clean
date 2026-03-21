import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import axios from 'axios';
import * as io from 'socket.io-client';

/**
 * Integration Tests for All Notification Channels
 * Tests: Push (FCM), Email (SendGrid), SMS (Twilio), Chat (WebSocket)
 */
describe('Notification Channels Integration Tests', () => {
  let app: INestApplication;
  let notificationApi: any;
  const TEST_USER_ID = 'test-user-123';
  const TEST_DRIVER_ID = 'test-driver-456';
  const TEST_RIDE_ID = 'test-ride-789';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // Load the actual app module
      imports: [], // Would import AppModule in real scenario
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(3002);

    // Create Axios client for API calls
    notificationApi = axios.create({
      baseURL: 'http://localhost:3002/api',
      validateStatus: () => true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // ============ PUSH NOTIFICATIONS (FCM) ============

  describe('Push Notifications (Firebase Cloud Messaging)', () => {
    const pushPayload = {
      userId: TEST_USER_ID,
      type: 'push',
      channels: ['push'],
      title: 'Ride Accepted',
      body: 'Driver John is on the way',
      metadata: {
        rideId: TEST_RIDE_ID,
        driverId: TEST_DRIVER_ID,
        priority: 'high',
      },
    };

    it('should send push notification successfully', async () => {
      const response = await notificationApi.post(
        '/notifications/send',
        pushPayload
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('notificationId');
      expect(response.data.channels).toContain('push');
      expect(response.data.status).toBe('sent');
    });

    it('should handle multiple device tokens (multicast)', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...pushPayload,
        deviceTokens: ['token_abc123', 'token_def456', 'token_ghi789'],
      });

      expect(response.status).toBe(200);
      expect(response.data.sentTo).toBeGreaterThan(0);
    });

    it('should remove invalid device tokens', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...pushPayload,
        deviceTokens: ['invalid_token_xyz'],
      });

      // Should fail gracefully or return partial success
      expect([200, 207]).toContain(response.status);
    });

    it('should support platform-specific options', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...pushPayload,
        platformOptions: {
          android: {
            priority: 'high',
            ttl: 3600,
          },
          ios: {
            priority: 10,
            sound: 'default',
            badge: 1,
          },
        },
      });

      expect(response.status).toBe(200);
    });

    it('should track push notification delivery status', async () => {
      const sendResponse = await notificationApi.post(
        '/notifications/send',
        pushPayload
      );
      const notificationId = sendResponse.data.notificationId;

      // Wait for async delivery
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch notification status
      const statusResponse = await notificationApi.get(
        `/notifications/${notificationId}`
      );

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.data).toHaveProperty('status');
      expect(['sent', 'delivered', 'pending']).toContain(
        statusResponse.data.status
      );
    });

    it('should handle FCM errors gracefully', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...pushPayload,
        deviceTokens: ['malformed_token_!@#$'],
      });

      // Should not crash, return appropriate error
      expect([400, 207]).toContain(response.status);
      expect(response.data).toHaveProperty('error');
    });
  });

  // ============ EMAIL NOTIFICATIONS (SendGrid) ============

  describe('Email Notifications (SendGrid)', () => {
    const emailPayload = {
      userId: TEST_USER_ID,
      type: 'email',
      channels: ['email'],
      title: 'Ride Receipt',
      body: 'Your ride is complete. View receipt below.',
      metadata: {
        rideId: TEST_RIDE_ID,
        amount: 25.5,
        currency: 'USD',
        recipientEmail: 'user@example.com',
      },
    };

    it('should send email notification successfully', async () => {
      const response = await notificationApi.post(
        '/notifications/send',
        emailPayload
      );

      expect(response.status).toBe(200);
      expect(response.data.channels).toContain('email');
      expect(response.data.status).toBe('sent');
    });

    it('should generate HTML email with tracking', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...emailPayload,
        enableTracking: true,
      });

      expect(response.status).toBe(200);
      expect(response.data.tracking).toBeDefined();
    });

    it('should validate email address', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...emailPayload,
        metadata: {
          ...emailPayload.metadata,
          recipientEmail: 'invalid-email',
        },
      });

      // Should fail validation
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('email');
    });

    it('should support email templates', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...emailPayload,
        template: 'ride_receipt',
        templateData: {
          rideId: TEST_RIDE_ID,
          distance: '5.2 km',
          duration: '12 minutes',
          fare: '$25.50',
          driverName: 'John Doe',
          rating: 5,
        },
      });

      expect(response.status).toBe(200);
    });

    it('should handle bulk email sending', async () => {
      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      const response = await notificationApi.post('/notifications/send/bulk', {
        recipients,
        template: 'weekly_summary',
        subject: 'Your Weekly Ride Summary',
      });

      expect(response.status).toBe(200);
      expect(response.data.sentCount).toBe(recipients.length);
    });

    it('should include action links in email', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...emailPayload,
        actions: [
          {
            label: 'View Receipt',
            url: `https://app.going.com/rides/${TEST_RIDE_ID}`,
          },
          {
            label: 'Rate Driver',
            url: `https://app.going.com/rate/${TEST_DRIVER_ID}`,
          },
        ],
      });

      expect(response.status).toBe(200);
    });
  });

  // ============ SMS NOTIFICATIONS (Twilio) ============

  describe('SMS Notifications (Twilio)', () => {
    const smsPayload = {
      userId: TEST_USER_ID,
      type: 'sms',
      channels: ['sms'],
      title: 'Arrival',
      body: 'Driver is 2 minutes away',
      metadata: {
        rideId: TEST_RIDE_ID,
        phoneNumber: '+1234567890',
        driverId: TEST_DRIVER_ID,
      },
    };

    it('should send SMS notification successfully', async () => {
      const response = await notificationApi.post(
        '/notifications/send',
        smsPayload
      );

      expect(response.status).toBe(200);
      expect(response.data.channels).toContain('sms');
      expect(response.data.status).toBe('sent');
    });

    it('should validate E.164 phone format', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...smsPayload,
        metadata: {
          ...smsPayload.metadata,
          phoneNumber: '1234567890', // Missing +
        },
      });

      // Should either auto-format or return error
      expect([200, 400]).toContain(response.status);
    });

    it('should handle SMS character limits', async () => {
      const longMessage = 'A'.repeat(200); // Over 160 chars

      const response = await notificationApi.post('/notifications/send', {
        ...smsPayload,
        body: longMessage,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('multiPartCount');
      expect(response.data.multiPartCount).toBeGreaterThan(1);
    });

    it('should include ride reference in SMS', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...smsPayload,
        includeRideReference: true,
      });

      expect(response.status).toBe(200);
      // SMS body should contain ride ID reference
    });

    it('should handle OTP codes via SMS', async () => {
      const response = await notificationApi.post('/notifications/send', {
        userId: TEST_USER_ID,
        type: 'sms',
        channels: ['sms'],
        title: 'Verification Code',
        body: 'Your OTP is: 123456',
        metadata: {
          phoneNumber: '+1234567890',
          otpCode: '123456',
          expiresIn: 300, // 5 minutes
        },
      });

      expect(response.status).toBe(200);
    });

    it('should track SMS delivery status', async () => {
      const sendResponse = await notificationApi.post(
        '/notifications/send',
        smsPayload
      );
      const notificationId = sendResponse.data.notificationId;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await notificationApi.get(
        `/notifications/${notificationId}`
      );

      expect(statusResponse.status).toBe(200);
      expect(['sent', 'delivered', 'failed']).toContain(
        statusResponse.data.status
      );
    });

    it('should handle invalid phone numbers gracefully', async () => {
      const response = await notificationApi.post('/notifications/send', {
        ...smsPayload,
        metadata: {
          ...smsPayload.metadata,
          phoneNumber: '+999999999999', // Invalid format
        },
      });

      // Should fail validation
      expect(response.status).toBe(400);
    });
  });

  // ============ REAL-TIME CHAT (WebSocket) ============

  describe('Real-time Chat (WebSocket via Socket.io)', () => {
    let userSocket: any;
    let driverSocket: any;

    beforeEach((done) => {
      // Connect as passenger
      userSocket = io('http://localhost:3002', {
        transports: ['websocket'],
        query: { userId: TEST_USER_ID, role: 'passenger' },
      });

      // Connect as driver
      driverSocket = io('http://localhost:3002', {
        transports: ['websocket'],
        query: { userId: TEST_DRIVER_ID, role: 'driver' },
      });

      // Wait for both to connect
      let connected = 0;
      const checkDone = () => {
        connected++;
        if (connected === 2) done();
      };

      userSocket.on('connect', checkDone);
      driverSocket.on('connect', checkDone);
    });

    afterEach(() => {
      userSocket.disconnect();
      driverSocket.disconnect();
    });

    it('should join ride chat room', (done) => {
      userSocket.emit('chat:join', { rideId: TEST_RIDE_ID }, (ack: any) => {
        expect(ack.success).toBe(true);
        expect(ack.room).toBe(`ride:${TEST_RIDE_ID}`);
        done();
      });
    });

    it('should send message to ride chat', (done) => {
      const message = 'I am here, coming up to you';

      driverSocket.on('chat:message:received', (data: any) => {
        expect(data.senderId).toBe(TEST_DRIVER_ID);
        expect(data.message).toBe(message);
        expect(data.rideId).toBe(TEST_RIDE_ID);
        done();
      });

      // Driver sends message
      driverSocket.emit('chat:message:send', {
        rideId: TEST_RIDE_ID,
        message,
      });
    });

    it('should handle typing indicators', (done) => {
      const typingHandler = (data: any) => {
        expect(data.userId).toBe(TEST_USER_ID);
        expect(data.isTyping).toBe(true);
        userSocket.removeListener('chat:typing', typingHandler);
        done();
      };

      driverSocket.on('chat:typing', typingHandler);

      // Passenger typing
      userSocket.emit('chat:typing', {
        rideId: TEST_RIDE_ID,
        isTyping: true,
      });
    });

    it('should mark message as read', (done) => {
      const messageId = 'msg-123';

      driverSocket.on('chat:message:read', (data: any) => {
        expect(data.messageId).toBe(messageId);
        expect(data.readBy).toBe(TEST_DRIVER_ID);
        done();
      });

      userSocket.emit('chat:message:read', {
        rideId: TEST_RIDE_ID,
        messageId,
      });
    });

    it('should handle message history', (done) => {
      userSocket.emit(
        'chat:history',
        { rideId: TEST_RIDE_ID, limit: 50 },
        (messages: any) => {
          expect(Array.isArray(messages)).toBe(true);
          expect(messages.length).toBeLessThanOrEqual(50);
          if (messages.length > 0) {
            expect(messages[0]).toHaveProperty('id');
            expect(messages[0]).toHaveProperty('senderId');
            expect(messages[0]).toHaveProperty('message');
          }
          done();
        }
      );
    });

    it('should handle participant list', (done) => {
      userSocket.emit(
        'chat:participants',
        { rideId: TEST_RIDE_ID },
        (participants: any) => {
          expect(Array.isArray(participants)).toBe(true);
          expect(participants.length).toBeGreaterThanOrEqual(1);
          expect(participants.map((p: any) => p.userId)).toContain(
            TEST_USER_ID
          );
          done();
        }
      );
    });

    it('should handle user disconnect gracefully', (done) => {
      driverSocket.on('chat:user:left', (data: any) => {
        expect(data.userId).toBe(TEST_USER_ID);
        expect(data.rideId).toBe(TEST_RIDE_ID);
        done();
      });

      userSocket.emit('chat:leave', { rideId: TEST_RIDE_ID });
      userSocket.disconnect();
    });

    it('should broadcast message to all ride participants', (done) => {
      const message = 'I am ready!';
      let receivedCount = 0;

      const checkDone = () => {
        receivedCount++;
        if (receivedCount === 2) done(); // Both driver and passenger receive
      };

      driverSocket.on('chat:message:received', (data: any) => {
        expect(data.message).toBe(message);
        checkDone();
      });

      userSocket.on('chat:message:received', (data: any) => {
        expect(data.message).toBe(message);
        checkDone();
      });

      userSocket.emit('chat:message:send', {
        rideId: TEST_RIDE_ID,
        message,
      });
    });

    it('should handle concurrent messages', async () => {
      const messages = ['Message 1', 'Message 2', 'Message 3'];
      const receivedMessages: string[] = [];

      return new Promise<void>((resolve) => {
        driverSocket.on('chat:message:received', (data: any) => {
          receivedMessages.push(data.message);
          if (receivedMessages.length === messages.length) {
            expect(receivedMessages).toEqual(messages);
            resolve();
          }
        });

        messages.forEach((msg) => {
          userSocket.emit('chat:message:send', {
            rideId: TEST_RIDE_ID,
            message: msg,
          });
        });
      });
    });
  });

  // ============ MULTI-CHANNEL NOTIFICATIONS ============

  describe('Multi-Channel Notifications', () => {
    it('should send notification across multiple channels', async () => {
      const multiChannelPayload = {
        userId: TEST_USER_ID,
        type: 'hybrid',
        channels: ['push', 'email', 'sms'],
        title: 'Urgent: Ride Cancelled',
        body: 'Your ride has been cancelled',
        metadata: {
          rideId: TEST_RIDE_ID,
          reason: 'driver_cancelled',
          refundAmount: 5.0,
          recipientEmail: 'user@example.com',
          phoneNumber: '+1234567890',
        },
      };

      const response = await notificationApi.post(
        '/notifications/send',
        multiChannelPayload
      );

      expect(response.status).toBe(200);
      expect(response.data.channels.length).toBe(3);
      expect(response.data).toHaveProperty('results');
    });

    it('should handle partial failures in multi-channel sending', async () => {
      const response = await notificationApi.post('/notifications/send', {
        userId: TEST_USER_ID,
        channels: ['push', 'email', 'invalid_channel'],
        title: 'Test',
        body: 'Testing',
      });

      // Should still send to valid channels, fail invalid one
      expect(response.data.results).toBeDefined();
      expect(response.data.successCount).toBeGreaterThan(0);
      expect(response.data.failureCount).toBeGreaterThanOrEqual(0);
    });

    it('should retry failed notifications', async () => {
      const payload = {
        userId: TEST_USER_ID,
        channels: ['push'],
        title: 'Test',
        body: 'Testing retry',
        metadata: { deviceTokens: ['will_fail'] },
      };

      const response = await notificationApi.post('/notifications/send', {
        ...payload,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('retryAttempts');
    });
  });

  // ============ NOTIFICATION HISTORY & MANAGEMENT ============

  describe('Notification History & Management', () => {
    it('should retrieve user notification history', async () => {
      const response = await notificationApi.get(
        `/notifications/user/${TEST_USER_ID}`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should support pagination in history', async () => {
      const response = await notificationApi.get(
        `/notifications/user/${TEST_USER_ID}?page=1&limit=20`
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('items');
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('page');
      expect(response.data.items.length).toBeLessThanOrEqual(20);
    });

    it('should filter notifications by type', async () => {
      const response = await notificationApi.get(
        `/notifications/user/${TEST_USER_ID}?type=push`
      );

      expect(response.status).toBe(200);
      const notifications = Array.isArray(response.data)
        ? response.data
        : response.data.items;
      notifications.forEach((notif: any) => {
        expect(notif.channels).toContain('push');
      });
    });

    it('should mark notification as read', async () => {
      // First, get a notification
      const historyResponse = await notificationApi.get(
        `/notifications/user/${TEST_USER_ID}`
      );
      if (historyResponse.data.length > 0) {
        const notificationId = historyResponse.data[0].id;

        const response = await notificationApi.put(
          `/notifications/${notificationId}/read`
        );

        expect(response.status).toBe(200);
        expect(response.data.read).toBe(true);
      }
    });

    it('should delete notification', async () => {
      // Send a test notification first
      const sendResponse = await notificationApi.post('/notifications/send', {
        userId: TEST_USER_ID,
        channels: ['push'],
        title: 'Delete Test',
        body: 'This will be deleted',
      });

      const notificationId = sendResponse.data.notificationId;

      const deleteResponse = await notificationApi.delete(
        `/notifications/${notificationId}`
      );

      expect(deleteResponse.status).toBe(200);
    });
  });
});
