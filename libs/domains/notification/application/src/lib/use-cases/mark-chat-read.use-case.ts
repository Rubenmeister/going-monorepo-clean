import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { IChatMessageRepository } from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class MarkChatReadUseCase {
  private readonly logger = new Logger(MarkChatReadUseCase.name);

  constructor(
    @Inject(IChatMessageRepository)
    private readonly chatRepo: IChatMessageRepository,
  ) {}

  async execute(tripId: UUID, recipientId: UUID): Promise<void> {
    const result = await this.chatRepo.markAllAsReadForTrip(tripId, recipientId);
    if (result.isErr()) {
      this.logger.error(`Failed to mark chat as read: ${result.error.message}`);
      throw new InternalServerErrorException(result.error.message);
    }
  }
}
