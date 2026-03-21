import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { IChatGateway } from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface OnlineUsersDto {
  rideId: UUID;
  onlineUserIds: UUID[];
  count: number;
}

@Injectable()
export class GetOnlineUsersUseCase {
  private readonly logger = new Logger(GetOnlineUsersUseCase.name);

  constructor(
    @Inject(IChatGateway)
    private readonly chatGateway: IChatGateway
  ) {}

  async execute(rideId: UUID): Promise<Result<OnlineUsersDto, Error>> {
    // Step 1: Get active users from gateway
    const activeUsersResult = await this.chatGateway.getActiveUsersForRide(
      rideId
    );
    if (activeUsersResult.isErr()) {
      this.logger.error(
        `Failed to get active users: ${activeUsersResult.error.message}`
      );
      return err(activeUsersResult.error);
    }

    const onlineUserIds = activeUsersResult.value;

    // Step 2: Return result
    const result: OnlineUsersDto = {
      rideId,
      onlineUserIds,
      count: onlineUserIds.length,
    };

    this.logger.log(
      `Found ${onlineUserIds.length} online users for ride ${rideId}`
    );
    return ok(result);
  }
}
