import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { ExpoPushService } from '../services/expo-push.service';

/**
 * Ride Dispatch Gateway
 * Notifies matched drivers of new ride offers via 2 canales en paralelo:
 *   1. notifications-service HTTP (legacy, mantiene historial de notificaciones)
 *   2. Expo Push API directo (entrega push real al mobile-driver-app)
 *
 * El driver app registra su Expo push token al login en
 * POST /transport/drivers/me/push-token. ExpoPushService busca ese token
 * y manda push directo a https://exp.host/--/api/v2/push/send.
 */
@Injectable()
export class RideDispatchGateway {
  private readonly logger = new Logger(RideDispatchGateway.name);
  private readonly notificationsUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly expoPush: ExpoPushService,
  ) {
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
        `Dispatching ride ${rideId} to ${driverIds.length} drivers (Expo + notifications-service)`
      );

      const buildPayload = (driverId: string) => {
        const match = matches.find((m) => m.driverId === driverId);
        return {
          title: '🚗 Nueva solicitud de viaje',
          body: match
            ? `${match.distance?.toFixed(1) ?? '?'} km · ETA ${match.eta ?? '?'} min`
            : 'Hay un viaje disponible cerca de ti',
          data: {
            type: 'ride_match', // mobile listener filtra por este string
            rideId,
            matchId: match?.matchId,
            distance: match?.distance,
            eta: match?.eta,
          },
        };
      };

      // Canal 1: Expo Push API directo al device (latencia mínima, fiable)
      const expoSends = driverIds.map((driverId) =>
        this.expoPush.sendToDriver(String(driverId), buildPayload(String(driverId))),
      );

      // Canal 2: notifications-service HTTP — historial + fallback redundante
      const notifSends = driverIds.map((driverId) => {
        const payload = buildPayload(String(driverId));
        return fetch(`${this.notificationsUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: driverId,
            title: payload.title,
            body: payload.body,
            channel: 'PUSH',
            data: payload.data,
          }),
        }).catch((e) =>
          this.logger.warn(`notifications-service push to ${driverId} failed: ${e.message}`)
        );
      });

      await Promise.allSettled([...expoSends, ...notifSends]);
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

  /**
   * Viajes oportunistas — modelo Going
   *
   * Cuando un conductor está en una ciudad destino con 1-2h libre,
   * se notifica a TODOS los conductores elegibles simultáneamente.
   * El primero en aceptar (y más cercano) se queda con el viaje.
   *
   * Reglas:
   *  - Driver.opportunisticMode = true
   *  - Driver.currentCity = ciudad del pickup
   *  - Driver.opportunisticUntil > now
   *  - Solo para viajes cortos urbanos / aeropuerto (< 30 km)
   */
  async broadcastOpportunisticTrip(
    rideId:    UUID,
    city:      string,
    driverIds: UUID[],
    rideInfo:  {
      origin:      string;
      destination: string;
      distanceKm:  number;
      estimatedFare: number;
    }
  ): Promise<Result<void, Error>> {
    try {
      this.logger.log(
        `[OPORTUNISTA] Ride ${rideId} en ${city} → ${driverIds.length} conductores disponibles`
      );

      const sends = driverIds.map(driverId =>
        fetch(`${this.notificationsUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId:  driverId,
            title:   '⚡ Viaje oportunista disponible',
            body:    `${rideInfo.origin} → ${rideInfo.destination} · $${rideInfo.estimatedFare.toFixed(0)} · El primero en aceptar lo toma`,
            channel: 'PUSH',
            data: {
              type:          'OPPORTUNISTIC_RIDE',
              rideId,
              city,
              origin:        rideInfo.origin,
              destination:   rideInfo.destination,
              distanceKm:    rideInfo.distanceKm,
              estimatedFare: rideInfo.estimatedFare,
              expiresIn:     30, // segundos para aceptar
            },
          }),
        }).catch(e => this.logger.warn(`Push oportunista a ${driverId} falló: ${e.message}`))
      );

      await Promise.allSettled(sends);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Error broadcast oportunista: ${error.message}`);
      return err(new Error(error.message));
    }
  }

  /**
   * Notificación programada — T-24h y T-1h
   * Se envía a conductor Y pasajeros del viaje programado
   */
  async broadcastScheduledTripReminder(
    rideId:    UUID,
    userIds:   UUID[],   // conductores + pasajeros
    type:      '24h' | '1h',
    tripInfo:  { route: string; departureTime: string; date: string }
  ): Promise<Result<void, Error>> {
    try {
      const title = type === '24h'
        ? '📅 Tu viaje es mañana'
        : '⏰ Tu viaje comienza en 1 hora';
      const body = type === '24h'
        ? `${tripInfo.route} · ${tripInfo.date} a las ${tripInfo.departureTime}. ¡Confirma que estés listo!`
        : `${tripInfo.route} · Salida a las ${tripInfo.departureTime}. Prepárate.`;

      const sends = userIds.map(userId =>
        fetch(`${this.notificationsUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId, title, body,
            channel: 'PUSH',
            data: { type: `TRIP_REMINDER_${type.toUpperCase()}`, rideId, ...tripInfo },
          }),
        }).catch(() => {})
      );

      await Promise.allSettled(sends);
      this.logger.log(`[T-${type}] Reminder enviado para viaje ${rideId} a ${userIds.length} usuarios`);
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }
}
