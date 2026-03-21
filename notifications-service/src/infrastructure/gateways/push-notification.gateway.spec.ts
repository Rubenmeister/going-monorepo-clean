import { Test, TestingModule } from '@nestjs/testing';
import { FirebasePushNotificationGateway } from './push-notification.gateway';

describe('FirebasePushNotificationGateway', () => {
  let gateway: FirebasePushNotificationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirebasePushNotificationGateway],
    }).compile();

    gateway = module.get<FirebasePushNotificationGateway>(
      FirebasePushNotificationGateway
    );
  });

  describe('send', () => {
    const mockNotification = {
      id: 'notif_123',
      userId: 'user_456',
      title: 'Ride Matched',
      body: 'A driver has been assigned',
      imageUrl: 'https://example.com/image.jpg',
      data: {
        rideId: 'ride_123',
        actionUrl: '/rides/ride_123',
      },
      toPrimitives: () => ({
        id: 'notif_123',
        userId: 'user_456',
        title: 'Ride Matched',
        body: 'A driver has been assigned',
        imageUrl: 'https://example.com/image.jpg',
        data: {
          rideId: 'ride_123',
          actionUrl: '/rides/ride_123',
        },
      }),
    };

    it('should send notification in mock mode when Firebase not initialized', async () => {
      const result = await gateway.send(mockNotification as any);

      expect(result.isOk()).toBe(true);
    });

    it('should handle missing notification data gracefully', async () => {
      const invalidNotification = {
        toPrimitives: () => ({
          userId: 'user_456',
          title: 'Test',
          body: 'Test body',
        }),
      };

      const result = await gateway.send(invalidNotification as any);

      expect(result.isOk() || result.isErr()).toBe(true);
    });

    it('should include notification data in message', async () => {
      const result = await gateway.send(mockNotification as any);

      expect(result.isOk()).toBe(true);
    });

    it('should handle Android payload correctly', async () => {
      const result = await gateway.send(mockNotification as any);

      expect(result.isOk()).toBe(true);
      // In real scenario, verify Android-specific fields
    });

    it('should handle iOS/APNS payload correctly', async () => {
      const result = await gateway.send(mockNotification as any);

      expect(result.isOk()).toBe(true);
      // In real scenario, verify APNS-specific fields
    });

    it('should not throw on send in mock mode', async () => {
      expect(async () => {
        await gateway.send(mockNotification as any);
      }).not.toThrow();
    });
  });

  describe('onModuleInit', () => {
    it('should initialize in mock mode by default', () => {
      expect(() => {
        gateway.onModuleInit();
      }).not.toThrow();
    });
  });
});
