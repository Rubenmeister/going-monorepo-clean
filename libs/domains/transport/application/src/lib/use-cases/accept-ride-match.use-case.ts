import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { IRideMatchRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface AcceptRideMatchDto {
  matchId: UUID;
  rideId: UUID;
  driverId: UUID;
}

export interface AcceptRideMatchResultDto {
  matchId: UUID;
  rideId: UUID;
  driverId: UUID;
  status: string;
  acceptedAt: Date;
  eta: number;
}

@Injectable()
export class AcceptRideMatchUseCase {
  private readonly logger = new Logger(AcceptRideMatchUseCase.name);

  constructor(
    @Inject(IRideMatchRepository)
    private readonly rideMatchRepo: IRideMatchRepository
  ) {}

  async execute(
    dto: AcceptRideMatchDto
  ): Promise<Result<AcceptRideMatchResultDto, Error>> {
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
        `Driver ${dto.driverId} attempted to accept match for different driver`
      );
      return err(new Error('Driver ID mismatch'));
    }

    // Step 3: Accept the match (validates it's still pending)
    const acceptResult = match.accept();
    if (acceptResult.isErr()) {
      this.logger.warn(`Cannot accept match: ${acceptResult.error.message}`);
      return err(acceptResult.error);
    }

    // Step 4: Update match in repository
    const updateResult = await this.rideMatchRepo.update(match);
    if (updateResult.isErr()) {
      this.logger.error(
        `Failed to update match: ${updateResult.error.message}`
      );
      return err(updateResult.error);
    }

    // Step 5: Expire other matches for this ride (fire and forget)
    this.rideMatchRepo.expireOldMatches(dto.rideId).catch((error) => {
      this.logger.warn(`Failed to expire old matches: ${error.message}`);
    });

    // Step 6: Build response
    const result: AcceptRideMatchResultDto = {
      matchId: match.id,
      rideId: match.rideId,
      driverId: match.driverId,
      status: match.acceptanceStatus,
      acceptedAt: match.acceptedAt!,
      eta: match.eta,
    };

    this.logger.log(
      `Driver ${dto.driverId} accepted match ${dto.matchId} for ride ${dto.rideId}`
    );
    return ok(result);
  }
}
