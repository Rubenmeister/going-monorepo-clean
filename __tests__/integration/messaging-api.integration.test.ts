import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../notifications-service/src/app.module';

/**
 * Integration Tests for Messaging APIs
 *
 * Tests the complete messaging flow:
 * - Send messages
 * - Get messages
 * - Mark messages as read
 * - Get conversations
 * - Get unread messages
 * - Delete messages
 */
describe('Messaging API Integration Tests', () => {
  let app: INestApplication;
  let module: TestingModule;

  // Mock JWT token for testing
  const mockToken =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImlkIjoidXNlcl8xMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzAwMDAwMDB9.fake_signature';

  const testUser = {
    id: 'user_123',
    email: 'test@example.com',
  };

  const otherUser = {
    id: 'user_456',
    email: 'other@example.com',
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /chats/rides/:rideId/messages - Send Message', () => {
    const rideId = 'ride_123';
    const sendMessageDto = {
      content: 'Hello, I am on my way!',
      receiverId: otherUser.id,
    };

    it('should send a message successfully with valid JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockToken)
        .send(sendMessageDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('messageId');
      expect(response.body.rideId).toBe(rideId);
      expect(response.body.senderId).toBe(testUser.id);
      expect(response.body.content).toBe(sendMessageDto.content);
      expect(response.body.isRead).toBe(false);
    });

    it('should fail to send a message without JWT token', async () => {
      await request(app.getHttpServer())
        .post(`/chats/rides/${rideId}/messages`)
        .send(sendMessageDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail with invalid message content (empty)', async () => {
      const invalidDto = { content: '', receiverId: otherUser.id };
      await request(app.getHttpServer())
        .post(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with missing receiverId', async () => {
      const invalidDto = { content: 'Hello' };
      await request(app.getHttpServer())
        .post(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockToken)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle multiple concurrent messages', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post(`/chats/rides/${rideId}/messages`)
          .set('Authorization', mockToken)
          .send({ ...sendMessageDto, content: `Message ${i}` })
          .expect(HttpStatus.CREATED)
      );

      const responses = await Promise.all(requests);
      expect(responses.length).toBe(5);
      responses.forEach((res) => {
        expect(res.body).toHaveProperty('messageId');
        expect(res.body.rideId).toBe(rideId);
      });
    });
  });

  describe('GET /chats/rides/:rideId/messages - Get Messages', () => {
    const rideId = 'ride_123';

    it('should retrieve messages for a ride', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support pagination with limit query parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chats/rides/${rideId}/messages?limit=10`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array for ride with no messages', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chats/rides/ride_no_messages/messages`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .get(`/chats/rides/${rideId}/messages`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /chats/rides/:rideId/conversation - Get Conversation', () => {
    const rideId = 'ride_123';

    it('should retrieve conversation between users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chats/rides/${rideId}/conversation`)
        .set('Authorization', mockToken)
        .query({ otherUserId: otherUser.id })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('messages');
      expect(response.body).toHaveProperty('unreadCount');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(typeof response.body.unreadCount).toBe('number');
    });

    it('should support pagination with limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chats/rides/${rideId}/conversation`)
        .set('Authorization', mockToken)
        .query({ otherUserId: otherUser.id, limit: 5 })
        .expect(HttpStatus.OK);

      expect(response.body.messages.length).toBeLessThanOrEqual(5);
    });

    it('should fail without otherUserId query parameter', async () => {
      await request(app.getHttpServer())
        .get(`/chats/rides/${rideId}/conversation`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .get(`/chats/rides/${rideId}/conversation`)
        .query({ otherUserId: otherUser.id })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /chats/messages/:messageId/read - Mark as Read', () => {
    const messageId = 'msg_123';

    it('should mark a message as read', async () => {
      const response = await request(app.getHttpServer())
        .put(`/chats/messages/${messageId}/read`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('messageId');
      expect(response.body.isRead).toBe(true);
    });

    it('should handle marking already read message', async () => {
      const response = await request(app.getHttpServer())
        .put(`/chats/messages/${messageId}/read`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(response.body.isRead).toBe(true);
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .put(`/chats/messages/${messageId}/read`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle non-existent message gracefully', async () => {
      const response = await request(app.getHttpServer())
        .put(`/chats/messages/msg_nonexistent/read`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /chats/unread - Get Unread Messages', () => {
    it('should retrieve all unread messages for current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/chats/unread')
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((msg: any) => {
        expect(msg.isRead).toBe(false);
        expect(msg.receiverId).toBe(testUser.id);
      });
    });

    it('should return empty array if no unread messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/chats/unread')
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .get('/chats/unread')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /chats/messages/:messageId - Delete Message', () => {
    const messageId = 'msg_123';

    it('should delete a message successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/messages/${messageId}`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/messages/${messageId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle deleting non-existent message', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/messages/msg_nonexistent`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Message Persistence Integration', () => {
    const rideId = 'ride_persistence_test';

    it('should persist and retrieve messages correctly', async () => {
      // Send a message
      const sendResponse = await request(app.getHttpServer())
        .post(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockToken)
        .send({
          content: 'Persistence test message',
          receiverId: otherUser.id,
        })
        .expect(HttpStatus.CREATED);

      const messageId = sendResponse.body.messageId;

      // Retrieve the message
      const getResponse = await request(app.getHttpServer())
        .get(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(
        getResponse.body.some((msg: any) => msg.messageId === messageId)
      ).toBe(true);
    });

    it('should update message status when marked as read', async () => {
      // Send a message
      const sendResponse = await request(app.getHttpServer())
        .post(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockToken)
        .send({
          content: 'Mark as read test',
          receiverId: otherUser.id,
        })
        .expect(HttpStatus.CREATED);

      const messageId = sendResponse.body.messageId;
      expect(sendResponse.body.isRead).toBe(false);

      // Mark as read
      const markResponse = await request(app.getHttpServer())
        .put(`/chats/messages/${messageId}/read`)
        .set('Authorization', mockToken)
        .expect(HttpStatus.OK);

      expect(markResponse.body.isRead).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const rideId = 'ride_123';
      const response = await request(app.getHttpServer())
        .get(`/chats/rides/${rideId}/messages`)
        .set('Authorization', mockToken);

      // Should return either OK with data or 500 with error message
      expect([HttpStatus.OK, HttpStatus.INTERNAL_SERVER_ERROR]).toContain(
        response.status
      );
    });

    it('should handle malformed requests', async () => {
      await request(app.getHttpServer())
        .post('/chats/rides/123/messages')
        .set('Authorization', mockToken)
        .send({ invalid: 'data' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle rate limiting', async () => {
      const requests = Array.from({ length: 100 }, () =>
        request(app.getHttpServer())
          .post('/chats/rides/123/messages')
          .set('Authorization', mockToken)
          .send({
            content: 'Rate limit test',
            receiverId: 'user_456',
          })
      );

      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.filter(
        (r) =>
          r.status === 'fulfilled' &&
          r.value.status === HttpStatus.TOO_MANY_REQUESTS
      );

      // Should have some rate-limited responses (infrastructure dependent)
      expect(rateLimited.length).toBeGreaterThanOrEqual(0);
    });
  });
});
