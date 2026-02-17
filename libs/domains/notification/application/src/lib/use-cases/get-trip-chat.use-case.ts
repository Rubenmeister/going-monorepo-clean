import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { IChatMessageRepository } from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface TripChatMessageDto {
  id: string;
  senderId: string;
  senderRole: string;
  content: string;
  status: string;
  createdAt: Date;
  readAt?: Date;
}

@Injectable()
export class GetTripChatUseCase {
  constructor(
    @Inject(IChatMessageRepository)
    private readonly chatRepo: IChatMessageRepository,
  ) {}

  async execute(tripId: UUID, limit = 50): Promise<TripChatMessageDto[]> {
    const result = await this.chatRepo.findByTripId(tripId, limit);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((msg) => {
      const props = msg.toPrimitives();
      return {
        id: props.id as string,
        senderId: props.senderId as string,
        senderRole: props.senderRole as string,
        content: props.content as string,
        status: props.status as string,
        createdAt: props.createdAt as Date,
        readAt: props.readAt as Date | undefined,
      };
    });
  }
}
