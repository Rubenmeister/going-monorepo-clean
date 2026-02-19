import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  IMessageRepository,
  IChatGateway,
} from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface MarkMessageAsReadDto {
  messageId: UUID;
  userId: UUID;
}

@Injectable()
export class MarkMessageAsReadUseCase {
  private readonly logger = new Logger(MarkMessageAsReadUseCase.name);

  constructor(
    @Inject(IMessageRepository)
    private readonly messageRepo: IMessageRepository,
    @Inject(IChatGateway)
    private readonly chatGateway: IChatGateway
  ) {}

  async execute(dto: MarkMessageAsReadDto): Promise<Result<void, Error>> {
    // Step 1: Find message by ID
    const messageResult = await this.messageRepo.findById(dto.messageId);
    if (messageResult.isErr()) {
      this.logger.error(
        `Failed to find message: ${messageResult.error.message}`
      );
      return err(messageResult.error);
    }

    const message = messageResult.value;
    if (!message) {
      return err(new Error('Message not found'));
    }

    // Step 2: Mark message as read (validates receiver)
    const markReadResult = message.markAsRead(dto.userId);
    if (markReadResult.isErr()) {
      this.logger.warn(
        `Cannot mark message as read: ${markReadResult.error.message}`
      );
      return err(markReadResult.error);
    }

    // Step 3: Update message in repository
    const updateResult = await this.messageRepo.update(message);
    if (updateResult.isErr()) {
      this.logger.error(
        `Failed to update message: ${updateResult.error.message}`
      );
      return err(updateResult.error);
    }

    // Step 4: Broadcast read receipt via WebSocket
    this.chatGateway
      .broadcastMessageRead(message.id, message.rideId, dto.userId)
      .catch((error) => {
        this.logger.warn(`Failed to broadcast read receipt: ${error.message}`);
      });

    this.logger.log(`Message ${dto.messageId} marked as read by ${dto.userId}`);
    return ok(undefined);
  }
}
