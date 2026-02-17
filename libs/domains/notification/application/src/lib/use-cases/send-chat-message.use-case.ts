import { Inject, Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  ChatMessage,
  ChatParticipantRole,
  IChatMessageRepository,
} from '@going-monorepo-clean/domains-notification-core';
import { SendChatMessageDto } from '../dto/send-chat-message.dto';

export interface ChatMessageResponseDto {
  id: string;
  tripId: string;
  senderId: string;
  senderRole: string;
  recipientId: string;
  content: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class SendChatMessageUseCase {
  private readonly logger = new Logger(SendChatMessageUseCase.name);

  constructor(
    @Inject(IChatMessageRepository)
    private readonly chatRepo: IChatMessageRepository,
  ) {}

  async execute(dto: SendChatMessageDto): Promise<ChatMessageResponseDto> {
    const messageResult = ChatMessage.create({
      tripId: dto.tripId,
      senderId: dto.senderId,
      senderRole: dto.senderRole as ChatParticipantRole,
      recipientId: dto.recipientId,
      content: dto.content,
    });

    if (messageResult.isErr()) {
      throw new BadRequestException(messageResult.error.message);
    }

    const message = messageResult.value;

    const saveResult = await this.chatRepo.save(message);
    if (saveResult.isErr()) {
      this.logger.error(`Failed to save chat message: ${saveResult.error.message}`);
      throw new InternalServerErrorException(saveResult.error.message);
    }

    const props = message.toPrimitives();
    return {
      id: props.id as string,
      tripId: props.tripId as string,
      senderId: props.senderId as string,
      senderRole: props.senderRole as string,
      recipientId: props.recipientId as string,
      content: props.content as string,
      status: props.status as string,
      createdAt: props.createdAt as Date,
    };
  }
}
