import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
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
    private readonly rideMatchRepo: IRideMatchRepository,
    @Optional()
    @Inject('IRideRepository')
    private readonly rideRepo?: any
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

    // Step 2b: Overlap Wellness Gate check
    // If the driver manually accepts a real-time (on-demand) ride, we verify that they do not have
    // an upcoming scheduled ride/trip in the next 2 hours. If they do, we block the acceptance.
    if (this.rideRepo) {
      try {
        const currentRide = await this.rideRepo.findById(match.rideId);
        // Only enforce overlap gate if accepting a real-time ride (no scheduledAt set)
        if (currentRide && !currentRide.scheduledAt) {
          const activeRides = await this.rideRepo.findActiveByDriverId(dto.driverId);
          const hasUpcomingScheduled = activeRides?.some((ride: any) => {
            if (!ride.scheduledAt) return false;
            const scheduledTime = new Date(ride.scheduledAt).getTime();
            const now = Date.now();
            const twoHoursMs = 2 * 60 * 60 * 1000;
            return scheduledTime >= now && scheduledTime <= now + twoHoursMs;
          });

          if (hasUpcomingScheduled) {
            this.logger.warn(
              `Blocking accept for driver ${dto.driverId}: Driver has an upcoming scheduled ride within the 2-hour buffer window.`
            );
            return err(new Error('Cannot accept: Scheduled intercity carpool starts in less than 2 hours'));
          }
        }
      } catch (e) {
        this.logger.warn(
          `Failed to check scheduled ride overlap during acceptance for driver ${dto.driverId}: ${(e as Error).message}`
        );
      }
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
