import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IRideRepository } from '../../domain/ports';

/**
 * Complete Ride Use Case
 * Finaliza el viaje y calcula la tarifa REAL según distancia/duración reales.
 * También sincroniza el estado del booking en el servicio de bookings.
 *
 * Fórmula: baseFare + (distanceKm × perKmRate) + (durationMin × perMinRate) × surgeMultiplier
 */
@Injectable()
export class CompleteRideUseCase {
  private readonly logger = new Logger(CompleteRideUseCase.name);
  private readonly bookingServiceUrl: string;

  constructor(
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.bookingServiceUrl = configService.get<string>(
      'BOOKING_SERVICE_URL',
      'http://localhost:3006'
    );
  }

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

    // Sincronizar estado de booking en el servicio de bookings (no-blocking)
    if (updated.bookingId) {
      this.syncBookingStatus(updated.bookingId, 'completed').catch((err) => {
        this.logger.warn(
          `Could not sync booking ${updated.bookingId} status: ${err?.message}`,
        );
      });
    }

    // Registrar viaje en blockchain (no-blocking)
    const blockchainUrl = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3018';
    fetch(`${blockchainUrl}/blockchain/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rideId:          updated.id,
        userId:          updated.userId,
        driverId:        updated.driverId,
        fromAddress:     updated.from || '',
        toAddress:       updated.to || '',
        distanceKm,
        durationSeconds,
        fare:            finalFare,
        paymentMethod:   updated.paymentMethod || 'cash',
        completedAt:     updated.completedAt,
      }),
    }).catch(e => this.logger.warn(`Blockchain record failed: ${e.message}`));

    // Registrar viaje en recomendaciones (no-blocking)
    const recommendationUrl = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3020';
    fetch(`${recommendationUrl}/recommendations/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:      updated.userId,
        from:        updated.from || '',
        to:          updated.to || '',
        fromLat:     updated.fromLatitude,
        fromLng:     updated.fromLongitude,
        toLat:       updated.toLatitude,
        toLng:       updated.toLongitude,
        rideId:      updated.id,
      }),
    }).catch(e => this.logger.warn(`Recommendation history failed: ${e.message}`));

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

  /**
   * Sincroniza el estado del booking con el servicio de bookings
   */
  private async syncBookingStatus(bookingId: string, status: string): Promise<void> {
    try {
      await this.httpService
        .patch(`${this.bookingServiceUrl}/bookings/${bookingId}`, { status })
        .toPromise();
      this.logger.debug(`Booking ${bookingId} synced with status: ${status}`);
    } catch (error: any) {
      // Rethrow para que el caller maneje
      throw error;
    }
  }
}
