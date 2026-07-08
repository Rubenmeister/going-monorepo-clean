import { Injectable, Inject, Logger } from '@nestjs/common';
import { IRideRepository } from '../../domain/ports';

/**
 * Accept Ride Use Case
 * Driver accepts a ride request
 */
@Injectable()
export class AcceptRideUseCase {
  private readonly logger = new Logger(AcceptRideUseCase.name);

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

    // Push al pasajero: conductor asignado. Ruta REAL /notifications/send (el
    // notifications-service no tiene prefijo global) + token S2S; antes usaba
    // /api/notifications/send SIN token → 404/401 siempre (push nunca llegaba).
    const notifUrl = (process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3008').replace(/\/$/, '');
    const notifToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (notifToken) {
      fetch(`${notifUrl}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${notifToken}` },
        body: JSON.stringify({
          userId: updated.userId,
          type: 'ride_driver_accepted',
          title: '🚗 ¡Conductor asignado!',
          body: 'Un conductor aceptó tu viaje y está en camino',
          data: { rideId: updated.id, actionUrl: '/transport' },
        }),
        signal: AbortSignal.timeout(5000),
      }).catch((err) =>
        this.logger.warn(`push accept ride ${updated.id}: ${err?.message ?? err}`),
      ); // non-blocking
    } else {
      this.logger.warn('INTERNAL_SERVICE_TOKEN ausente — push de accept omitido');
    }

    return {
      rideId: updated.id,
      status: updated.status,
      driverId: updated.driverId,
      acceptedAt: updated.acceptedAt,
    };
  }
}
