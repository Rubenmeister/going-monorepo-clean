import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Parcel Dispatch Gateway
 * Notifies nearby drivers of new parcel delivery requests via the notifications-service.
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

  async broadcastParcelToDrivers(
    parcelId: string,
    driverIds: string[],
    parcelInfo: { originAddress: string; destinationAddress: string; price: number }
  ): Promise<void> {
    if (driverIds.length === 0) return;

    this.logger.log(
      `Dispatching parcel ${parcelId} to ${driverIds.length} nearby drivers`
    );

    const sends = driverIds.map((driverId) =>
      fetch(`${this.notificationsUrl}/notifications/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: driverId,
          title: '📦 Nueva solicitud de envío',
          body: `${parcelInfo.originAddress} → ${parcelInfo.destinationAddress} · $${parcelInfo.price.toFixed(2)}`,
          data: {
            type: 'PARCEL_REQUEST',
            parcelId,
          },
        }),
      }).catch((e) =>
        this.logger.warn(`Push to driver ${driverId} failed: ${e.message}`)
      )
    );

    await Promise.allSettled(sends);
  }
}
