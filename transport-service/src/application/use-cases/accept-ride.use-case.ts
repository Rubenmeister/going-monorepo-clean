import { Injectable, Inject } from '@nestjs/common';
import { IRideRepository } from '../../domain/ports';

/**
 * Accept Ride Use Case
 * Driver accepts a ride request
 */
@Injectable()
export class AcceptRideUseCase {
  constructor(
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository
  ) {}

  async execute(input: { rideId: string; driverId: string }): Promise<any> {
    const { rideId, driverId } = input;

    // Get ride
    const ride = await this.rideRepo.findById(rideId);
    if (!ride) {
      throw new Error(`Ride ${rideId} not found`);
    }

    if (ride.status !== 'requested') {
      throw new Error(`Ride is already ${ride.status}`);
    }

    // Accept ride
    const updated = await this.rideRepo.update(rideId, {
      driverId,
      status: 'accepted',
      acceptedAt: new Date(),
    });

    // Push notification to passenger that driver was assigned
    const notifUrl = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005';
    fetch(`${notifUrl}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: ride.userId,
        title: '🚗 ¡Conductor asignado!',
        body: 'Un conductor aceptó tu viaje y está en camino',
        data: { rideId: ride.id, actionUrl: '/transport' }
      }),
    }).catch(() => {}); // non-blocking

    return {
      rideId: updated.id,
      status: updated.status,
      driverId: updated.driverId,
      acceptedAt: updated.acceptedAt,
    };
  }
}
