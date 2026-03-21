import { Test, TestingModule } from '@nestjs/testing';
import { GetConversationUseCase } from './get-conversation.use-case';
import { IMessageRepository } from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { ok, err } from 'neverthrow';

describe('GetConversationUseCase', () => {
  let useCase: GetConversationUseCase;
  let mockMessageRepo: jest.Mocked<IMessageRepository>;

  beforeEach(async () => {
    mockMessageRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByRideId: jest.fn(),
      deleteMessage: jest.fn(),
      saveConversation: jest.fn(),
      updateConversation: jest.fn(),
      findConversation: jest.fn(),
      findConversationsByUserId: jest.fn(),
      getUnreadCount: jest.fn(),
      getUnreadCountByRide: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetConversationUseCase,
        { provide: IMessageRepository, useValue: mockMessageRepo },
      ],
    }).compile();

    useCase = module.get<GetConversationUseCase>(GetConversationUseCase);
  });

  describe('execute', () => {
    const validDto = {
      rideId: 'ride_123' as UUID,
      userId: 'user_456' as UUID,
      otherUserId: 'user_789' as UUID,
      page: 1,
      limit: 50,
    };

    const mockConversation = {
      id: 'conv_123' as UUID,
      rideId: 'ride_123' as UUID,
      participants: ['user_456' as UUID, 'user_789' as UUID],
      lastMessage: {
        messageId: 'msg_123' as UUID,
        content: 'Last message',
        senderId: 'user_456' as UUID,
        timestamp: new Date(),
      },
      unreadCounts: [
        { userId: 'user_456' as UUID, count: 0 },
        { userId: 'user_789' as UUID, count: 2 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      toPrimitives: () => ({}),
      markAllAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
      getTotalUnreadCount: jest.fn(),
      getOtherParticipant: jest.fn(),
      addMessage: jest.fn(),
      markMessageAsRead: jest.fn(),
    };

    it('should fetch conversation successfully', async () => {
      mockMessageRepo.findConversation.mockResolvedValue(ok(mockConversation));
      mockMessageRepo.findByRideId.mockResolvedValue(ok([]));
      mockMessageRepo.getUnreadCountByRide.mockResolvedValue(ok(0));

      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveProperty('rideId');
      expect(result.value).toHaveProperty('participants');
      expect(result.value).toHaveProperty('messages');
    });

    it('should return error for invalid pagination', async () => {
      const invalidDto = { ...validDto, page: 0 };

      const result = await useCase.execute(invalidDto);

      expect(result.isErr()).toBe(true);
    });

    it('should return error for limit exceeding maximum', async () => {
      const invalidDto = { ...validDto, limit: 101 };

      const result = await useCase.execute(invalidDto);

      expect(result.isErr()).toBe(true);
    });

    it('should handle conversation not found', async () => {
      mockMessageRepo.findConversation.mockResolvedValue(ok(null));

      const result = await useCase.execute(validDto);

      expect(result.isErr()).toBe(true);
      expect(result.error?.message).toContain('not found');
    });

    it('should mark messages as read', async () => {
      const mockMessage = {
        id: 'msg_123' as UUID,
        status: 'DELIVERED',
        receiverId: 'user_456' as UUID,
        markAsRead: jest.fn().mockReturnValue(ok(undefined)),
      };

      mockMessageRepo.findConversation.mockResolvedValue(ok(mockConversation));
      mockMessageRepo.findByRideId.mockResolvedValue(ok([mockMessage as any]));
      mockMessageRepo.getUnreadCountByRide.mockResolvedValue(ok(1));
      mockMessageRepo.update.mockResolvedValue(ok(undefined));

      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
    });

    it('should support pagination', async () => {
      mockMessageRepo.findConversation.mockResolvedValue(ok(mockConversation));
      mockMessageRepo.findByRideId.mockResolvedValue(ok([]));
      mockMessageRepo.getUnreadCountByRide.mockResolvedValue(ok(0));

      const dto = { ...validDto, page: 2, limit: 25 };
      const result = await useCase.execute(dto);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveProperty('page', 2);
    });

    it('should include unread count', async () => {
      mockMessageRepo.findConversation.mockResolvedValue(ok(mockConversation));
      mockMessageRepo.findByRideId.mockResolvedValue(ok([]));
      mockMessageRepo.getUnreadCountByRide.mockResolvedValue(ok(3));

      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
      expect(result.value?.unreadCount).toBe(3);
    });

    it('should handle database errors gracefully', async () => {
      mockMessageRepo.findConversation.mockResolvedValue(
        err(new Error('DB Connection failed'))
      );

      const result = await useCase.execute(validDto);

      expect(result.isErr()).toBe(true);
    });
  });
});
