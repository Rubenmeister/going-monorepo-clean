import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  IMessageRepository,
  PaginationParams,
} from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface GetConversationDto {
  rideId: UUID;
  userId: UUID;
  otherUserId: UUID;
  page: number;
  limit: number;
}

export interface MessageDto {
  id: UUID;
  senderId: UUID;
  receiverId: UUID;
  content: string;
  status: string;
  createdAt: Date;
  isRead: boolean;
}

export interface ConversationDto {
  rideId: UUID;
  participants: UUID[];
  messages: MessageDto[];
  unreadCount: number;
  total: number;
  page: number;
  hasMore: boolean;
}

@Injectable()
export class GetConversationUseCase {
  private readonly logger = new Logger(GetConversationUseCase.name);

  constructor(
    @Inject(IMessageRepository)
    private readonly messageRepo: IMessageRepository
  ) {}

  async execute(
    dto: GetConversationDto
  ): Promise<Result<ConversationDto, Error>> {
    // Step 1: Validate pagination parameters
    if (dto.page < 1 || dto.limit < 1 || dto.limit > 100) {
      return err(new Error('Invalid pagination parameters'));
    }

    // Step 2: Find conversation
    const conversationResult = await this.messageRepo.findConversation(
      dto.rideId,
      dto.userId,
      dto.otherUserId
    );

    if (conversationResult.isErr()) {
      this.logger.error(
        `Failed to fetch conversation: ${conversationResult.error.message}`
      );
      return err(conversationResult.error);
    }

    const conversation = conversationResult.value;
    if (!conversation) {
      return err(new Error('Conversation not found'));
    }

    // Step 3: Fetch paginated messages
    const pagination: PaginationParams = {
      page: dto.page,
      limit: dto.limit,
      sortBy: 'newest',
    };

    const messagesResult = await this.messageRepo.findByRideId(
      dto.rideId,
      pagination
    );
    if (messagesResult.isErr()) {
      this.logger.error(
        `Failed to fetch messages: ${messagesResult.error.message}`
      );
      return err(messagesResult.error);
    }

    const messages = messagesResult.value;

    // Step 4: Get unread count for current user
    const unreadResult = await this.messageRepo.getUnreadCountByRide(
      dto.rideId,
      dto.userId
    );
    const unreadCount = unreadResult.isOk() ? unreadResult.value : 0;

    // Step 5: Mark messages as read for current user (for all messages where user is receiver)
    for (const message of messages) {
      if (message.receiverId === dto.userId && message.status !== 'READ') {
        const markReadResult = message.markAsRead(dto.userId);
        if (markReadResult.isOk()) {
          await this.messageRepo.update(message);
        }
      }
    }

    // Step 6: Transform to DTOs
    const messageDtos: MessageDto[] = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      status: msg.status,
      createdAt: msg.createdAt,
      isRead: msg.isRead(),
    }));

    const conversationDto: ConversationDto = {
      rideId: conversation.rideId,
      participants: conversation.participants,
      messages: messageDtos,
      unreadCount,
      total: messages.length,
      page: dto.page,
      hasMore: messages.length === dto.limit,
    };

    this.logger.log(
      `Fetched conversation for ride ${dto.rideId}, page ${dto.page}, unread: ${unreadCount}`
    );
    return ok(conversationDto);
  }
}
