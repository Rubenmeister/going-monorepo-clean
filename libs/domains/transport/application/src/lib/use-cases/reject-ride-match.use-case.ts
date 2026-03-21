import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { IRideMatchRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface RejectRideMatchDto {
  matchId: UUID;
  driverId: UUID;
  reason?: string;
}

export interface RejectRideMatchResultDto {
  matchId: UUID;
  status: string;
  rejectedAt: Date;
}

@Injectable()
export class RejectRideMatchUseCase {
  private readonly logger = new Logger(RejectRideMatchUseCase.name);

  constructor(
    @Inject(IRideMatchRepository)
    private readonly rideMatchRepo: IRideMatchRepository
  ) {}

  async execute(
    dto: RejectRideMatchDto
  ): Promise<Result<RejectRideMatchResultDto, Error>> {
    // Step 1: Find match by ID
    const matchResult = await this.rideMatchRepo.findById(dto.matchId);
    if (matchResult.isErr()) {
      this.logger.error(`Failed to find match: ${matchResult.error.message}`);
      return err(matchResult.error);
    }

    const match = matchResult.value;
    if (!match) {
      return err(new Error('Match not found'));
    }

    // Step 2: Validate match belongs to driver
    if (match.driverId !== dto.driverId) {
      this.logger.warn(
        `Driver ${dto.driverId} attempted to reject match belonging to different driver`
      );
      return err(new Error('Driver ID mismatch'));
    }

    // Step 3: Reject the match (validates it's still pending)
    const rejectResult = match.reject();
    if (rejectResult.isErr()) {
      this.logger.warn(`Cannot reject match: ${rejectResult.error.message}`);
      return err(rejectResult.error);
    }

    // Step 4: Update match in repository
    const updateResult = await this.rideMatchRepo.update(match);
    if (updateResult.isErr()) {
      this.logger.error(
        `Failed to update match: ${updateResult.error.message}`
      );
      return err(updateResult.error);
    }

    // Step 5: Build response
    const result: RejectRideMatchResultDto = {
      matchId: match.id,
      status: match.acceptanceStatus,
      rejectedAt: match.rejectedAt!,
    };

    this.logger.log(
      `Driver ${dto.driverId} rejected match ${dto.matchId}${
        dto.reason ? ` - Reason: ${dto.reason}` : ''
      }`
    );
    return ok(result);
  }
}
