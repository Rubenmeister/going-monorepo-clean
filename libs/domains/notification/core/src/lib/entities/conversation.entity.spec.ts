import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { v4 as uuidv4 } from 'uuid';

describe('Conversation Entity', () => {
  const rideId = uuidv4();
  const userId1 = uuidv4();
  const userId2 = uuidv4();

  describe('create', () => {
    it('should create a valid conversation', () => {
      const result = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const conversation = result.value;
        expect(conversation.rideId).toBe(rideId);
        expect(conversation.participants).toEqual([userId1, userId2]);
        expect(conversation.unreadCounts).toHaveLength(2);
      }
    });

    it('should fail when rideId is missing', () => {
      const result = Conversation.create({
        rideId: '',
        participants: [userId1, userId2],
      });

      expect(result.isErr()).toBe(true);
    });

    it('should fail with less than 2 participants', () => {
      const result = Conversation.create({
        rideId,
        participants: [userId1],
      });

      expect(result.isErr()).toBe(true);
    });

    it('should fail with duplicate participants', () => {
      const result = Conversation.create({
        rideId,
        participants: [userId1, userId1],
      });

      expect(result.isErr()).toBe(true);
    });

    it('should initialize unread counts to 0', () => {
      const result = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (result.isOk()) {
        const conversation = result.value;
        expect(conversation.getUnreadCount(userId1)).toBe(0);
        expect(conversation.getUnreadCount(userId2)).toBe(0);
      }
    });
  });

  describe('addMessage', () => {
    it('should add message and update last message', () => {
      const conversationResult = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (conversationResult.isOk()) {
        const conversation = conversationResult.value;
        const messageResult = Message.create({
          rideId,
          senderId: userId1,
          receiverId: userId2,
          content: 'Hello',
        });

        if (messageResult.isOk()) {
          const result = (conversation as any).addMessage(messageResult.value);

          expect(result.isOk()).toBe(true);
          expect(conversation.lastMessage).toBeDefined();
          expect(conversation.lastMessage?.content).toBe('Hello');
        }
      }
    });

    it('should increment unread count for receiver', () => {
      const conversationResult = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (conversationResult.isOk()) {
        const conversation = conversationResult.value;
        const messageResult = Message.create({
          rideId,
          senderId: userId1,
          receiverId: userId2,
          content: 'Hello',
        });

        if (messageResult.isOk()) {
          (conversation as any).addMessage(messageResult.value);
          expect(conversation.getUnreadCount(userId2)).toBe(1);
          expect(conversation.getUnreadCount(userId1)).toBe(0);
        }
      }
    });

    it('should fail when message ride does not match', () => {
      const conversationResult = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (conversationResult.isOk()) {
        const conversation = conversationResult.value;
        const messageResult = Message.create({
          rideId: uuidv4(), // Different ride
          senderId: userId1,
          receiverId: userId2,
          content: 'Hello',
        });

        if (messageResult.isOk()) {
          const result = (conversation as any).addMessage(messageResult.value);
          expect(result.isErr()).toBe(true);
        }
      }
    });
  });

  describe('markAllAsRead', () => {
    it('should reset unread count for user', () => {
      const conversationResult = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (conversationResult.isOk()) {
        const conversation = conversationResult.value;

        // Add messages to create unread count
        const messageResult = Message.create({
          rideId,
          senderId: userId1,
          receiverId: userId2,
          content: 'Hello',
        });

        if (messageResult.isOk()) {
          (conversation as any).addMessage(messageResult.value);
          expect(conversation.getUnreadCount(userId2)).toBe(1);

          const result = (conversation as any).markAllAsRead(userId2);
          expect(result.isOk()).toBe(true);
          expect(conversation.getUnreadCount(userId2)).toBe(0);
        }
      }
    });

    it('should fail when user is not a participant', () => {
      const conversationResult = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (conversationResult.isOk()) {
        const conversation = conversationResult.value;
        const result = (conversation as any).markAllAsRead(uuidv4());

        expect(result.isErr()).toBe(true);
      }
    });
  });

  describe('getUnreadCount', () => {
    it('should return 0 for new conversation', () => {
      const result = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (result.isOk()) {
        expect(result.value.getUnreadCount(userId1)).toBe(0);
      }
    });

    it('should return correct count after messages', () => {
      const conversationResult = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (conversationResult.isOk()) {
        const conversation = conversationResult.value;

        for (let i = 0; i < 3; i++) {
          const messageResult = Message.create({
            rideId,
            senderId: userId1,
            receiverId: userId2,
            content: `Message ${i}`,
          });

          if (messageResult.isOk()) {
            (conversation as any).addMessage(messageResult.value);
          }
        }

        expect(conversation.getUnreadCount(userId2)).toBe(3);
      }
    });
  });

  describe('getOtherParticipant', () => {
    it('should return the other participant in 2-user conversation', () => {
      const result = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (result.isOk()) {
        expect(result.value.getOtherParticipant(userId1)).toBe(userId2);
        expect(result.value.getOtherParticipant(userId2)).toBe(userId1);
      }
    });

    it('should return null for multi-user conversations', () => {
      const userId3 = uuidv4();
      const result = Conversation.create({
        rideId,
        participants: [userId1, userId2, userId3],
      });

      if (result.isOk()) {
        expect(result.value.getOtherParticipant(userId1)).toBeNull();
      }
    });
  });

  describe('toPrimitives and fromPrimitives', () => {
    it('should convert to primitives and back', () => {
      const result = Conversation.create({
        rideId,
        participants: [userId1, userId2],
      });

      if (result.isOk()) {
        const conversation = result.value;
        const primitives = conversation.toPrimitives();
        const restored = Conversation.fromPrimitives(primitives);

        expect(restored.id).toBe(conversation.id);
        expect(restored.rideId).toBe(conversation.rideId);
        expect(restored.participants).toEqual(conversation.participants);
      }
    });
  });
});
