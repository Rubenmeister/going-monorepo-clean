import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * Ride Dispatch Gateway
 * Notifies matched drivers of new ride offers via the notifications-service.
 * Uses HTTP POST to the internal notifications endpoint so the notifications-service
 * handles FCM/APNs push delivery (no Socket.io required here).
 */
@Injectable()
export class RideDispatchGateway {
  private readonly logger = new Logger(RideDispatchGateway.name);
  private readonly notificationsUrl: string;

  constructor(private readonly config: ConfigService) {
    this.notificationsUrl =
      this.config.get<string>('NOTIFICATIONS_SERVICE_URL') ||
      'http://localhost:3008';
  }

  async broadcastRideMatches(
    rideId: UUID,
    matches: any[],
    driverIds: UUID[]
  ): Promise<Result<void, Error>> {
    try {
      this.logger.log(
        `Dispatching ride ${rideId} to ${driverIds.length} drivers`
      );

      // Send one push notification per matched driver (fire-and-forget per driver)
      const sends = driverIds.map((driverId) => {
        const match = matches.find((m) => m.driverId === driverId);
        return fetch(`${this.notificationsUrl}/notifications/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: driverId,
            title: '🚗 Nueva solicitud de viaje',
            body: match
              ? `${match.distance?.toFixed(1) ?? '?'} km · ETA ${match.eta ?? '?'} min`
              : 'Hay un viaje disponible cerca de ti',
            data: {
              type: 'RIDE_MATCH',
              rideId,
              matchId: match?.matchId,
              distance: match?.distance,
              eta: match?.eta,
            },
          }),
        }).catch((e) =>
          this.logger.warn(`Push to driver ${driverId} failed: ${e.message}`)
        );
      });

      await Promise.allSettled(sends);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to dispatch ride matches: ${error.message}`);
      return err(new Error(`Failed to dispatch ride matches: ${error.message}`));
    }
  }

  async broadcastDriverAccepted(
    rideId: UUID,
    driverId: UUID,
    driverInfo: any
  ): Promise<Result<void, Error>> {
    try {
      this.logger.log(`Driver ${driverId} accepted ride ${rideId}`);
      // Notify the passenger (looked up from ride in a future enhancement)
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to broadcast acceptance: ${error.message}`);
      return err(new Error(`Failed to broadcast acceptance: ${error.message}`));
    }
  }

  async broadcastDriverRejected(
    rideId: UUID,
    driverId: UUID,
    reason?: string
  ): Promise<Result<void, Error>> {
    try {
      this.logger.log(`Driver ${driverId} rejected ride ${rideId} — ${reason}`);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to broadcast rejection: ${error.message}`);
      return err(new Error(`Failed to broadcast rejection: ${error.message}`));
    }
  }

  async broadcastRideStatusUpdate(
    rideId: UUID,
    status: string,
    metadata?: any
  ): Promise<Result<void, Error>> {
    try {
      this.logger.log(`Ride ${rideId} status → ${status}`);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to broadcast status: ${error.message}`);
      return err(new Error(`Failed to broadcast status: ${error.message}`));
    }
  }

  getActiveDriverCount(): number {
    return 0; // Managed by tracking-service via Redis
  }
}
