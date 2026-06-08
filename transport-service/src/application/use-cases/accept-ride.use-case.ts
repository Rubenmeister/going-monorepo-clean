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

    // Compare-and-swap atómico: asigna el conductor sólo si el viaje sigue en
    // 'requested'. Si otro conductor ya lo tomó (o no existe), devuelve null.
    const updated = await this.rideRepo.acceptIfRequested(rideId, driverId);
    if (!updated) {
      const existing = await this.rideRepo.findById(rideId);
      if (!existing) throw new Error(`Ride ${rideId} not found`);
      throw new Error(`Ride is already ${existing.status}`);
    }

    // Push notification to passenger that driver was assigned
    const notifUrl = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005';
    fetch(`${notifUrl}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: updated.userId,
        title: '🚗 ¡Conductor asignado!',
        body: 'Un conductor aceptó tu viaje y está en camino',
        data: { rideId: updated.id, actionUrl: '/transport' }
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
