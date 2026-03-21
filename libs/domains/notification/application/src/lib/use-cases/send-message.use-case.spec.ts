import { Test, TestingModule } from '@nestjs/testing';
import { Result, ok, err } from 'neverthrow';
import { SendMessageUseCase } from './send-message.use-case';
import {
  IMessageRepository,
  IChatGateway,
} from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;
  let mockMessageRepo: jest.Mocked<IMessageRepository>;
  let mockChatGateway: jest.Mocked<IChatGateway>;

  beforeEach(async () => {
    // Create mocks
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

    mockChatGateway = {
      broadcastMessage: jest.fn(),
      broadcastMessageRead: jest.fn(),
      broadcastTypingIndicator: jest.fn(),
      broadcastPresence: jest.fn(),
      getActiveUsersForRide: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      notifyUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendMessageUseCase,
        { provide: IMessageRepository, useValue: mockMessageRepo },
        { provide: IChatGateway, useValue: mockChatGateway },
      ],
    }).compile();

    useCase = module.get<SendMessageUseCase>(SendMessageUseCase);
  });

  describe('execute', () => {
    const validDto = {
      rideId: 'ride_123' as UUID,
      senderId: 'user_456' as UUID,
      receiverId: 'user_789' as UUID,
      content: 'Hello, where are you?',
      messageType: 'TEXT' as const,
    };

    it('should send message successfully', async () => {
      mockMessageRepo.save.mockResolvedValue(ok(undefined));
      mockMessageRepo.update.mockResolvedValue(ok(undefined));
      mockChatGateway.broadcastMessage.mockResolvedValue(ok(undefined));

      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
      expect(mockMessageRepo.save).toHaveBeenCalled();
      expect(mockMessageRepo.update).toHaveBeenCalled();
      expect(mockChatGateway.broadcastMessage).toHaveBeenCalled();
    });

    it('should reject empty content', async () => {
      const invalidDto = { ...validDto, content: '' };

      const result = await useCase.execute(invalidDto);

      expect(result.isErr()).toBe(true);
      expect(mockMessageRepo.save).not.toHaveBeenCalled();
    });

    it('should reject content exceeding 2000 characters', async () => {
      const invalidDto = {
        ...validDto,
        content: 'a'.repeat(2001),
      };

      const result = await useCase.execute(invalidDto);

      expect(result.isErr()).toBe(true);
    });

    it('should reject when sender is receiver', async () => {
      const invalidDto = {
        ...validDto,
        senderId: 'user_456' as UUID,
        receiverId: 'user_456' as UUID,
      };

      const result = await useCase.execute(invalidDto);

      expect(result.isErr()).toBe(true);
    });

    it('should reject when rideId is missing', async () => {
      const invalidDto = { ...validDto, rideId: undefined as any };

      const result = await useCase.execute(invalidDto);

      expect(result.isErr()).toBe(true);
    });

    it('should handle database save failure', async () => {
      mockMessageRepo.save.mockResolvedValue(err(new Error('Database error')));

      const result = await useCase.execute(validDto);

      expect(result.isErr()).toBe(true);
      expect(result.error?.message).toContain('Database error');
    });

    it('should handle WebSocket broadcast failure gracefully', async () => {
      mockMessageRepo.save.mockResolvedValue(ok(undefined));
      mockMessageRepo.update.mockResolvedValue(ok(undefined));
      mockChatGateway.broadcastMessage.mockRejectedValue(
        new Error('WebSocket error')
      );

      // Should not throw, should log warning instead
      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
    });

    it('should include attachments in message', async () => {
      const dtoWithAttachments = {
        ...validDto,
        attachments: [
          {
            type: 'image' as const,
            url: 'https://example.com/image.jpg',
            size: 2048,
            uploadedAt: new Date(),
          },
        ],
      };

      mockMessageRepo.save.mockResolvedValue(ok(undefined));
      mockMessageRepo.update.mockResolvedValue(ok(undefined));
      mockChatGateway.broadcastMessage.mockResolvedValue(ok(undefined));

      const result = await useCase.execute(dtoWithAttachments);

      expect(result.isOk()).toBe(true);
    });

    it('should return messageId on success', async () => {
      mockMessageRepo.save.mockResolvedValue(ok(undefined));
      mockMessageRepo.update.mockResolvedValue(ok(undefined));
      mockChatGateway.broadcastMessage.mockResolvedValue(ok(undefined));

      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveProperty('messageId');
      expect(typeof result.value.messageId).toBe('string');
    });
  });
});
