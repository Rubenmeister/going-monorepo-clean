import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import * as io from 'socket.io-client';
import { AppModule as TransportAppModule } from '../../transport-service/src/app.module';
import { AppModule as NotificationsAppModule } from '../../notifications-service/src/app.module';

/**
 * Multi-Service Integration Tests
 *
 * Tests workflows that span multiple microservices:
 * - Ride Request → Driver Matching → Real-time Messages
 * - Payment Processing → Ride Completion
 * - Rating & Feedback → Driver Profile Update
 * - WebSocket real-time updates
 */
describe('Multi-Service Integration Tests', () => {
  let transportApp: INestApplication;
  let notificationsApp: INestApplication;
  let transportModule: TestingModule;
  let notificationsModule: TestingModule;

  const mockPassengerToken =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImlkIjoidXNlcl8xMjMiLCJlbWFpbCI6InBhc3NlbmdlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzMDAwMDAwMH0.fake_signature';
  const mockDriverToken =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkcml2ZXJfMTIzIiwiaWQiOiJkcml2ZXJfMTIzIiwiZW1haWwiOiJkcml2ZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzAwMDAwMDB9.fake_signature';

  const testPassenger = {
    id: 'user_123',
    email: 'passenger@example.com',
  };

  const testDriver = {
    id: 'driver_123',
    email: 'driver@example.com',
  };

  beforeAll(async () => {
    // Initialize transport service
    transportModule = await Test.createTestingModule({
      imports: [TransportAppModule],
    }).compile();

    transportApp = transportModule.createNestApplication();
    await transportApp.init();

    // Initialize notifications service
    notificationsModule = await Test.createTestingModule({
      imports: [NotificationsAppModule],
    }).compile();

    notificationsApp = notificationsModule.createNestApplication();
    await notificationsApp.init();
  });

  afterAll(async () => {
    await transportApp.close();
    await notificationsApp.close();
  });

  describe('Complete Ride Workflow', () => {
    let rideId: string;
    let messageId: string;

    it('1. Passenger requests a ride', async () => {
      const response = await request(transportApp.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockPassengerToken)
        .send({
          pickupLatitude: 40.7128,
          pickupLongitude: -74.006,
          dropoffLatitude: 40.758,
          dropoffLongitude: -73.9855,
          serviceType: 'standard',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('rideId');
      rideId = response.body.rideId;

      // Verify ride exists in transport service
      await request(transportApp.getHttpServer())
        .get(`/rides/${rideId}`)
        .set('Authorization', mockPassengerToken)
        .expect(HttpStatus.OK);
    });

    it('2. Driver accepts ride', async () => {
      const response = await request(transportApp.getHttpServer())
        .put(`/rides/${rideId}/accept`)
        .set('Authorization', mockDriverToken)
        .send({ driverId: testDriver.id })
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('accepted');
      expect(response.body.driverId).toBe(testDriver.id);
    });

    it('3. Passenger and Driver exchange messages', async () => {
      // Passenger sends message
      const sendResponse = await request(notificationsApp.getHttpServer())
        .post(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockPassengerToken)
        .send({
          content: 'Hi driver, where are you?',
          receiverId: testDriver.id,
        })
        .expect(HttpStatus.CREATED);

      expect(sendResponse.body).toHaveProperty('messageId');
      messageId = sendResponse.body.messageId;

      // Driver sends reply
      await request(notificationsApp.getHttpServer())
        .post(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockDriverToken)
        .send({
          content: '5 minutes away',
          receiverId: testPassenger.id,
        })
        .expect(HttpStatus.CREATED);

      // Retrieve conversation
      const conversationResponse = await request(
        notificationsApp.getHttpServer()
      )
        .get(`/chats/rides/${rideId}/conversation`)
        .set('Authorization', mockPassengerToken)
        .query({ otherUserId: testDriver.id })
        .expect(HttpStatus.OK);

      expect(conversationResponse.body.messages).toHaveLength.greaterThan(0);
    });

    it('4. Driver starts ride', async () => {
      await request(transportApp.getHttpServer())
        .put(`/rides/${rideId}/start`)
        .set('Authorization', mockDriverToken)
        .send({})
        .expect(HttpStatus.OK);

      // Verify ride status
      const rideResponse = await request(transportApp.getHttpServer())
        .get(`/rides/${rideId}`)
        .set('Authorization', mockPassengerToken)
        .expect(HttpStatus.OK);

      expect(rideResponse.body.status).toBe('started');
    });

    it('5. Real-time updates during ride', async () => {
      // Both users should see location updates
      const passengerRide = await request(transportApp.getHttpServer())
        .get(`/rides/${rideId}`)
        .set('Authorization', mockPassengerToken)
        .expect(HttpStatus.OK);

      expect(passengerRide.body).toHaveProperty('driverLocation');
      expect(passengerRide.body).toHaveProperty('eta');
      expect(passengerRide.body).toHaveProperty('distance');
    });

    it('6. Driver completes ride', async () => {
      const completeResponse = await request(transportApp.getHttpServer())
        .put(`/rides/${rideId}/complete`)
        .set('Authorization', mockDriverToken)
        .send({
          distanceKm: 5.2,
          durationSeconds: 1200,
        })
        .expect(HttpStatus.OK);

      expect(completeResponse.body.status).toBe('completed');
      expect(completeResponse.body.distance).toBe(5.2);
    });

    it('7. Passenger marks message as read', async () => {
      const response = await request(notificationsApp.getHttpServer())
        .put(`/chats/messages/${messageId}/read`)
        .set('Authorization', mockPassengerToken)
        .expect(HttpStatus.OK);

      expect(response.body.isRead).toBe(true);
    });
  });

  describe('WebSocket Real-time Communication', () => {
    const rideId = 'ride_websocket_test';
    let passengerSocket: io.Socket;
    let driverSocket: io.Socket;

    afterEach(() => {
      if (passengerSocket) {
        passengerSocket.close();
      }
      if (driverSocket) {
        driverSocket.close();
      }
    });

    it('should establish WebSocket connection for chat', (done) => {
      passengerSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockPassengerToken,
        },
      });

      passengerSocket.on('connect', () => {
        expect(passengerSocket.connected).toBe(true);
        done();
      });
    });

    it('should join ride chat room', (done) => {
      passengerSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockPassengerToken,
        },
      });

      passengerSocket.on('connect', () => {
        passengerSocket.emit('chat:join', {
          rideId,
          userId: testPassenger.id,
        });

        passengerSocket.on('chat:joined', (data) => {
          expect(data.rideId).toBe(rideId);
          done();
        });
      });
    });

    it('should send and receive real-time messages', (done) => {
      passengerSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockPassengerToken,
        },
      });

      driverSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockDriverToken,
        },
      });

      const messageContent = 'Real-time message test';

      passengerSocket.on('connect', () => {
        passengerSocket.emit('chat:join', { rideId, userId: testPassenger.id });

        driverSocket.on('connect', () => {
          driverSocket.emit('chat:join', { rideId, userId: testDriver.id });

          // Send message
          passengerSocket.emit('chat:message:send', {
            rideId,
            senderId: testPassenger.id,
            receiverId: testDriver.id,
            content: messageContent,
          });

          // Receive message
          driverSocket.on('chat:message:received', (msg) => {
            expect(msg.content).toBe(messageContent);
            expect(msg.senderId).toBe(testPassenger.id);
            done();
          });
        });
      });
    });

    it('should broadcast typing indicator', (done) => {
      passengerSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockPassengerToken,
        },
      });

      driverSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockDriverToken,
        },
      });

      passengerSocket.on('connect', () => {
        passengerSocket.emit('chat:join', { rideId, userId: testPassenger.id });

        driverSocket.on('connect', () => {
          driverSocket.emit('chat:join', { rideId, userId: testDriver.id });

          // Send typing indicator
          passengerSocket.emit('chat:typing', {
            rideId,
            userId: testPassenger.id,
          });

          // Receive typing indicator
          driverSocket.on('chat:typing', (data) => {
            expect(data.userId).toBe(testPassenger.id);
            done();
          });
        });
      });
    });

    it('should broadcast user presence', (done) => {
      passengerSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockPassengerToken,
        },
      });

      driverSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockDriverToken,
        },
      });

      let connectedCount = 0;

      const checkBothConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          passengerSocket.emit('chat:join', {
            rideId,
            userId: testPassenger.id,
          });

          driverSocket.on('user:online', (data) => {
            expect(data.userId).toBe(testPassenger.id);
            done();
          });
        }
      };

      passengerSocket.on('connect', checkBothConnected);
      driverSocket.on('connect', checkBothConnected);
    });

    it('should broadcast read receipts', (done) => {
      passengerSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockPassengerToken,
        },
      });

      driverSocket = io(`http://localhost:3001/chat`, {
        extraHeaders: {
          Authorization: mockDriverToken,
        },
      });

      let connectedCount = 0;

      const checkBothConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          passengerSocket.emit('chat:join', {
            rideId,
            userId: testPassenger.id,
          });
          driverSocket.emit('chat:join', { rideId, userId: testDriver.id });

          // Send message
          passengerSocket.emit('chat:message:send', {
            rideId,
            senderId: testPassenger.id,
            receiverId: testDriver.id,
            content: 'Read receipt test',
          });

          // Mark as read
          driverSocket.on('chat:message:received', (msg) => {
            driverSocket.emit('chat:message:read', {
              rideId,
              messageId: msg.messageId,
              userId: testDriver.id,
            });

            // Receive read receipt
            passengerSocket.on('chat:read:receipt', (receipt) => {
              expect(receipt.messageId).toBe(msg.messageId);
              done();
            });
          });
        }
      };

      passengerSocket.on('connect', checkBothConnected);
      driverSocket.on('connect', checkBothConnected);
    });
  });

  describe('Cross-Service Data Consistency', () => {
    const rideId = 'ride_consistency_test';

    it('should maintain data consistency across services', async () => {
      // Create ride in transport service
      const requestResponse = await request(transportApp.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockPassengerToken)
        .send({
          pickupLatitude: 40.7128,
          pickupLongitude: -74.006,
          dropoffLatitude: 40.758,
          dropoffLongitude: -73.9855,
          serviceType: 'standard',
        })
        .expect(HttpStatus.CREATED);

      const newRideId = requestResponse.body.rideId;

      // Accept ride
      await request(transportApp.getHttpServer())
        .put(`/rides/${newRideId}/accept`)
        .set('Authorization', mockDriverToken)
        .send({ driverId: testDriver.id })
        .expect(HttpStatus.OK);

      // Create message in notifications service
      await request(notificationsApp.getHttpServer())
        .post(`/chats/rides/${newRideId}/messages`)
        .set('Authorization', mockPassengerToken)
        .send({
          content: 'Consistency test',
          receiverId: testDriver.id,
        })
        .expect(HttpStatus.CREATED);

      // Both services should have consistent ride data
      const transportRide = await request(transportApp.getHttpServer())
        .get(`/rides/${newRideId}`)
        .set('Authorization', mockPassengerToken)
        .expect(HttpStatus.OK);

      const notificationRide = await request(notificationsApp.getHttpServer())
        .get(`/chats/rides/${newRideId}/conversation`)
        .set('Authorization', mockPassengerToken)
        .query({ otherUserId: testDriver.id })
        .expect(HttpStatus.OK);

      expect(transportRide.body.rideId).toBe(notificationRide.body.rideId);
    });
  });

  describe('Error Handling Across Services', () => {
    it('should handle service unavailability gracefully', async () => {
      const response = await request(transportApp.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockPassengerToken)
        .send({
          pickupLatitude: 40.7128,
          pickupLongitude: -74.006,
          dropoffLatitude: 40.758,
          dropoffLongitude: -73.9855,
          serviceType: 'standard',
        });

      // Should either succeed or return service error
      expect([HttpStatus.CREATED, HttpStatus.SERVICE_UNAVAILABLE]).toContain(
        response.status
      );
    });

    it('should rollback on partial failure', async () => {
      // Request ride
      const rideResponse = await request(transportApp.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockPassengerToken)
        .send({
          pickupLatitude: 40.7128,
          pickupLongitude: -74.006,
          dropoffLatitude: 40.758,
          dropoffLongitude: -73.9855,
          serviceType: 'standard',
        })
        .expect(HttpStatus.CREATED);

      const newRideId = rideResponse.body.rideId;

      // Try to accept with invalid driver ID
      const acceptResponse = await request(transportApp.getHttpServer())
        .put(`/rides/${newRideId}/accept`)
        .set('Authorization', mockDriverToken)
        .send({ driverId: null });

      // Should reject invalid request
      expect(acceptResponse.status).toBe(HttpStatus.BAD_REQUEST);

      // Ride should still be in requested state
      const checkResponse = await request(transportApp.getHttpServer())
        .get(`/rides/${newRideId}`)
        .set('Authorization', mockPassengerToken)
        .expect(HttpStatus.OK);

      expect(checkResponse.body.status).toBe('requested');
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent requests across services', async () => {
      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, () =>
        request(transportApp.getHttpServer())
          .post('/rides/request')
          .set('Authorization', mockPassengerToken)
          .send({
            pickupLatitude: 40.7128,
            pickupLongitude: -74.006,
            dropoffLatitude: 40.758,
            dropoffLongitude: -73.9855,
            serviceType: 'standard',
          })
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      expect(
        responses.filter((r) => r.status === HttpStatus.CREATED).length
      ).toBe(concurrentRequests);
    });

    it('should maintain data integrity under concurrent operations', async () => {
      const rideResponse = await request(transportApp.getHttpServer())
        .post('/rides/request')
        .set('Authorization', mockPassengerToken)
        .send({
          pickupLatitude: 40.7128,
          pickupLongitude: -74.006,
          dropoffLatitude: 40.758,
          dropoffLongitude: -73.9855,
          serviceType: 'standard',
        })
        .expect(HttpStatus.CREATED);

      const newRideId = rideResponse.body.rideId;

      // Concurrent message sends
      const messageRequests = Array.from({ length: 5 }, (_, i) =>
        request(notificationsApp.getHttpServer())
          .post(`/chats/rides/${newRideId}/messages`)
          .set('Authorization', mockPassengerToken)
          .send({
            content: `Concurrent message ${i}`,
            receiverId: testDriver.id,
          })
      );

      const messageResponses = await Promise.all(messageRequests);

      // All messages should be created successfully
      expect(
        messageResponses.filter((r) => r.status === HttpStatus.CREATED).length
      ).toBe(5);

      // Retrieve all messages
      const conversationResponse = await request(
        notificationsApp.getHttpServer()
      )
        .get(`/chats/rides/${newRideId}/conversation`)
        .set('Authorization', mockPassengerToken)
        .query({ otherUserId: testDriver.id })
        .expect(HttpStatus.OK);

      // All 5 messages should be present
      expect(conversationResponse.body.messages.length).toBe(5);
    });
  });
});
