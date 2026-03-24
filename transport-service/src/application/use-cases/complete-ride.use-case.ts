import { Injectable, Inject } from '@nestjs/common';
import { IRideRepository } from '../../domain/ports';

/**
 * Complete Ride Use Case
 * Finaliza el viaje y calcula la tarifa REAL según distancia/duración reales.
 *
 * Fórmula: baseFare + (distanceKm × perKmRate) + (durationMin × perMinRate) × surgeMultiplier
 */
@Injectable()
export class CompleteRideUseCase {
  constructor(
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
  ) {}

  async execute(input: {
    rideId: string;
    distanceKm: number;
    durationSeconds: number;
  }): Promise<any> {
    const { rideId, distanceKm, durationSeconds } = input;

    const ride = await this.rideRepo.findById(rideId);
    if (!ride) throw new Error(`Ride ${rideId} not found`);

    if (ride.status !== 'started')
      throw new Error(`Can only complete rides in started status (current: ${ride.status})`);

    if (!ride.fare)
      throw new Error(`Ride ${rideId} has no fare — cannot complete`);

    // Calcular tarifa real usando los parámetros originales del viaje
    const durationMinutes = durationSeconds / 60;
    const baseFare        = ride.fare.baseFare        ?? 2.5;
    const perKmRate       = ride.fare.perKmFare        ?? 0.5;
    const perMinRate      = ride.fare.perMinuteFare    ?? 0.1;
    const surge           = ride.fare.surgeMultiplier  ?? 1.0;

    const realFare = parseFloat(
      ((baseFare + distanceKm * perKmRate + durationMinutes * perMinRate) * surge).toFixed(2)
    );

    // Mínimo $2.00
    const finalFare = Math.max(realFare, 2.0);

    const updated = await this.rideRepo.update(rideId, {
      status:          'completed',
      completedAt:     new Date(),
      durationSeconds,
      distanceKm,
      finalFare,
    });

    return {
      rideId:          updated.id,
      status:          updated.status,
      durationSeconds: updated.durationSeconds,
      distanceKm:      updated.distanceKm,
      finalFare:       updated.finalFare,
      completedAt:     updated.completedAt,
      // paymentRef disponible para que el controller haga el capture
      paymentRef:      updated.paymentRef,
      paymentTxnId:    updated.paymentTxnId,
    };
  }
}
