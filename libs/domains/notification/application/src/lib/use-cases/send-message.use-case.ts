import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  Message,
  IMessageRepository,
  IChatGateway,
} from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface SendMessageDto {
  rideId: UUID;
  senderId: UUID;
  receiverId: UUID;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'MEDIA' | 'SYSTEM';
}

@Injectable()
export class SendMessageUseCase {
  private readonly logger = new Logger(SendMessageUseCase.name);

  constructor(
    @Inject(IMessageRepository)
    private readonly messageRepo: IMessageRepository,
    @Inject(IChatGateway)
    private readonly chatGateway: IChatGateway
  ) {}

  async execute(
    dto: SendMessageDto
  ): Promise<Result<{ messageId: UUID }, Error>> {
    // Step 1: Create Message entity with domain validation
    const messageResult = Message.create({
      rideId: dto.rideId,
      senderId: dto.senderId,
      receiverId: dto.receiverId,
      content: dto.content,
      messageType: dto.messageType || 'TEXT',
    });

    if (messageResult.isErr()) {
      this.logger.error(
        `Message validation failed: ${messageResult.error.message}`
      );
      return err(messageResult.error);
    }

    const message = messageResult.value;

    // Step 2: Save message to repository with PENDING status
    const saveResult = await this.messageRepo.save(message);
    if (saveResult.isErr()) {
      this.logger.error(`Failed to save message: ${saveResult.error.message}`);
      return err(saveResult.error);
    }

    // Step 3: Mark message as sent
    const sentResult = message.markAsSent();
    if (sentResult.isErr()) {
      this.logger.warn(
        `Failed to mark message as sent: ${sentResult.error.message}`
      );
    } else {
      await this.messageRepo.update(message);
    }

    // Step 4: Broadcast message via WebSocket (fire and forget, don't block on failure)
    this.chatGateway
      .broadcastMessage({
        rideId: message.rideId,
        messageId: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        timestamp: message.createdAt,
        status: 'SENT',
      })
      .catch((error) => {
        this.logger.warn(
          `Failed to broadcast message ${message.id}: ${error.message}`
        );
      });

    this.logger.log(
      `Message ${message.id} sent successfully in ride ${dto.rideId}`
    );
    return ok({ messageId: message.id });
  }
}
