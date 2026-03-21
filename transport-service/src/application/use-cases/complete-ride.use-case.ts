import { Injectable, Inject } from '@nestjs/common';
import { IRideRepository } from '../../domain/ports';

/**
 * Complete Ride Use Case
 * Finalize a ride and calculate final fare
 */
@Injectable()
export class CompleteRideUseCase {
  constructor(
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository
  ) {}

  async execute(input: {
    rideId: string;
    distanceKm: number;
    durationSeconds: number;
  }): Promise<any> {
    const { rideId, distanceKm, durationSeconds } = input;

    // Get ride
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) {
      throw new Error(`Ride ${rideId} not found`);
    }

    if (ride.status !== 'started') {
      throw new Error(`Can only complete rides in started status`);
    }

    // Null-guard: fare must exist before accessing estimatedTotal
    if (!ride.fare) {
      throw new Error(`Ride ${rideId} has no fare — cannot complete`);
    }

    // Calculate final fare (simplified: use estimated total as final)
    const finalFare = ride.fare.estimatedTotal ?? 0;

    // Update ride
    const updated = await this.rideRepo.update(rideId, {
      status: 'completed',
      completedAt: new Date(),
      durationSeconds,
      distanceKm,
      finalFare,
    });

    return {
      rideId: updated.id,
      status: updated.status,
      durationSeconds: updated.durationSeconds,
      distanceKm: updated.distanceKm,
      finalFare: updated.finalFare,
      completedAt: updated.completedAt,
    };
  }
}
