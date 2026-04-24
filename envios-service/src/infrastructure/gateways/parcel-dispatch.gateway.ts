import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RankedDriver } from '../services/nearby-drivers.service';

/**
 * Parcel Dispatch Gateway
 * Notifies nearby drivers of new parcel delivery requests via notifications-service.
 *
 * Dos APIs:
 *   - broadcastParcelToDrivers(ids[]): legacy, sólo IDs (compat).
 *   - broadcastParcelToRankedDrivers(drivers[]): rico — incluye distancia,
 *     ETA, rating y prioridad. Preferido por el orchestrator.
 */
@Injectable()
export class ParcelDispatchGateway {
  private readonly logger = new Logger(ParcelDispatchGateway.name);
  private readonly notificationsUrl: string;

  constructor(private readonly config: ConfigService) {
    this.notificationsUrl =
      this.config.get<string>('NOTIFICATIONS_SERVICE_URL') ||
      'http://localhost:3008';
  }

  /**
   * Legacy: broadcast a lista plana de IDs. Mantener por compat con
   * callers antiguos que no tienen info ranqueada.
   */
  async broadcastParcelToDrivers(
    parcelId: string,
    driverIds: string[],
    parcelInfo: {
      originAddress: string;
      destinationAddress: string;
      price: number;
    },
  ): Promise<void> {
    if (driverIds.length === 0) return;

    this.logger.log(
      `Dispatching parcel ${parcelId} to ${driverIds.length} drivers (legacy)`,
    );

    const sends = driverIds.map((driverId) =>
      this.sendPush(driverId, parcelId, parcelInfo, null),
    );
    await Promise.allSettled(sends);
  }

  /**
   * Preferido: broadcast con info ranqueada. Cada conductor recibe su
   * distancia/ETA para que decida con contexto.
   */
  async broadcastParcelToRankedDrivers(
    parcelId: string,
    drivers: RankedDriver[],
    parcelInfo: {
      originAddress: string;
      destinationAddress: string;
      price: number;
      /** Número de intento actual (1-indexed) para telemetry. */
      attempt?: number;
    },
  ): Promise<void> {
    if (drivers.length === 0) return;

    this.logger.log(
      `Dispatching parcel ${parcelId} a ${drivers.length} conductores ranqueados` +
        (parcelInfo.attempt ? ` (intento ${parcelInfo.attempt})` : ''),
    );

    const sends = drivers.map((d) =>
      this.sendPush(d.driverId, parcelId, parcelInfo, d),
    );
    await Promise.allSettled(sends);
  }

  private async sendPush(
    driverId: string,
    parcelId: string,
    parcelInfo: {
      originAddress: string;
      destinationAddress: string;
      price: number;
      attempt?: number;
    },
    driver: RankedDriver | null,
  ): Promise<void> {
    const etaStr = driver ? ` · ${driver.etaMinutes} min` : '';
    const distStr = driver ? ` · ${driver.distanceKm.toFixed(1)} km` : '';

    const body =
      `${parcelInfo.originAddress} → ${parcelInfo.destinationAddress}` +
      ` · $${parcelInfo.price.toFixed(2)}${distStr}${etaStr}`;

    try {
      await fetch(`${this.notificationsUrl}/notifications/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: driverId,
          title: '📦 Nueva solicitud de envío',
          body,
          data: {
            type: 'PARCEL_REQUEST',
            parcelId,
            attempt: parcelInfo.attempt ?? 1,
            ...(driver
              ? {
                  distanceKm: driver.distanceKm,
                  etaMinutes: driver.etaMinutes,
                  rating: driver.rating,
                }
              : {}),
          },
        }),
      });
    } catch (e) {
      this.logger.warn(
        `Push al driver ${driverId} falló: ${(e as Error).message}`,
      );
    }
  }
}
