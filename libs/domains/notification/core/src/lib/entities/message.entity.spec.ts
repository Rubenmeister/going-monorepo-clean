import { Message } from './message.entity';
import { v4 as uuidv4 } from 'uuid';

describe('Message Entity', () => {
  const rideId = uuidv4();
  const senderId = uuidv4();
  const receiverId = uuidv4();

  describe('create', () => {
    it('should create a valid message', () => {
      const result = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello, how are you?',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const message = result.value;
        expect(message.rideId).toBe(rideId);
        expect(message.senderId).toBe(senderId);
        expect(message.receiverId).toBe(receiverId);
        expect(message.content).toBe('Hello, how are you?');
        expect(message.status).toBe('PENDING');
        expect(message.messageType).toBe('TEXT');
      }
    });

    it('should fail when rideId is missing', () => {
      const result = Message.create({
        rideId: '',
        senderId,
        receiverId,
        content: 'Hello',
      });

      expect(result.isErr()).toBe(true);
    });

    it('should fail when content is empty', () => {
      const result = Message.create({
        rideId,
        senderId,
        receiverId,
        content: '',
      });

      expect(result.isErr()).toBe(true);
    });

    it('should fail when content exceeds max length', () => {
      const longContent = 'a'.repeat(2001);
      const result = Message.create({
        rideId,
        senderId,
        receiverId,
        content: longContent,
      });

      expect(result.isErr()).toBe(true);
    });

    it('should fail when sender and receiver are the same', () => {
      const result = Message.create({
        rideId,
        senderId,
        receiverId: senderId,
        content: 'Hello',
      });

      expect(result.isErr()).toBe(true);
    });

    it('should create message with attachments', () => {
      const result = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Look at this image',
        attachments: [
          {
            type: 'image',
            url: 'https://example.com/image.jpg',
            size: 1024,
            uploadedAt: new Date(),
          },
        ],
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.attachments).toHaveLength(1);
      }
    });
  });

  describe('markAsSent', () => {
    it('should mark pending message as sent', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      expect(messageResult.isOk()).toBe(true);
      if (messageResult.isOk()) {
        const message = messageResult.value;
        const result = (message as any).markAsSent();

        expect(result.isOk()).toBe(true);
        expect(message.status).toBe('SENT');
      }
    });

    it('should fail when marking already sent message', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      if (messageResult.isOk()) {
        const message = messageResult.value;
        (message as any).markAsSent();
        const result = (message as any).markAsSent();

        expect(result.isErr()).toBe(true);
      }
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read by receiver', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      if (messageResult.isOk()) {
        const message = messageResult.value;
        (message as any).markAsSent();
        (message as any).markAsDelivered();

        const result = (message as any).markAsRead(receiverId);

        expect(result.isOk()).toBe(true);
        expect(message.status).toBe('READ');
        expect(message.readReceipts).toHaveLength(1);
      }
    });

    it('should fail when non-receiver tries to mark as read', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      if (messageResult.isOk()) {
        const message = messageResult.value;
        const result = (message as any).markAsRead(senderId);

        expect(result.isErr()).toBe(true);
      }
    });

    it('should not duplicate read receipts', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      if (messageResult.isOk()) {
        const message = messageResult.value;
        (message as any).markAsRead(receiverId);
        (message as any).markAsRead(receiverId);

        expect(message.readReceipts).toHaveLength(1);
      }
    });
  });

  describe('addAttachment', () => {
    it('should add attachment to message', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      if (messageResult.isOk()) {
        const message = messageResult.value;
        const result = (message as any).addAttachment({
          type: 'image',
          url: 'https://example.com/image.jpg',
          size: 2048,
          uploadedAt: new Date(),
        });

        expect(result.isOk()).toBe(true);
        expect(message.attachments).toHaveLength(1);
      }
    });

    it('should fail with invalid attachment', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      if (messageResult.isOk()) {
        const message = messageResult.value;
        const result = (message as any).addAttachment({
          type: 'image',
          url: '',
          size: 0,
          uploadedAt: new Date(),
        });

        expect(result.isErr()).toBe(true);
      }
    });
  });

  describe('isRead', () => {
    it('should return true when message is read', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      if (messageResult.isOk()) {
        const message = messageResult.value;
        (message as any).markAsSent();
        (message as any).markAsDelivered();
        (message as any).markAsRead(receiverId);

        expect(message.isRead()).toBe(true);
      }
    });

    it('should return false when message is not read', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      if (messageResult.isOk()) {
        expect(messageResult.value.isRead()).toBe(false);
      }
    });
  });

  describe('toPrimitives and fromPrimitives', () => {
    it('should convert to primitives and back', () => {
      const messageResult = Message.create({
        rideId,
        senderId,
        receiverId,
        content: 'Hello',
      });

      if (messageResult.isOk()) {
        const message = messageResult.value;
        const primitives = message.toPrimitives();
        const restored = Message.fromPrimitives(primitives);

        expect(restored.id).toBe(message.id);
        expect(restored.content).toBe(message.content);
        expect(restored.status).toBe(message.status);
      }
    });
  });
});
