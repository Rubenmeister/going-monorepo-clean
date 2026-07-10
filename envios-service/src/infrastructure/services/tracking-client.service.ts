import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface DriverLocation {
  lat: number;
  lng: number;
  lastUpdated?: Date;
}

/**
 * TrackingClientService — HTTP client de envios-service hacia tracking-service.
 *
 * Usado en GET /parcels/:id cuando el parcel tiene driver asignado y está
 * en pickup_assigned o in_transit. Permite que el sender (y receptor en C/D)
 * vea la ubicación del conductor en tiempo real desde el mismo endpoint
 * /parcels/:id sin tener que hacer una segunda llamada.
 *
 * Best-effort: si tracking-service responde mal o el driver no está activo,
 * retornamos undefined y el frontend simplemente no muestra el marker.
 */
@Injectable()
export class TrackingClientService {
  private readonly logger = new Logger(TrackingClientService.name);
  private readonly trackingUrl: string;

  constructor(private readonly config: ConfigService) {
    this.trackingUrl =
      this.config.get<string>('TRACKING_SERVICE_URL') ||
      'http://localhost:3009';
  }

  async getDriverLocation(driverId: string): Promise<DriverLocation | undefined> {
    try {
      // S2S: tracking-service ahora exige X-Internal-Token (auditoría Bloque 2
      // #6/#10). Sin él, la ubicación del conductor era pública.
      const internalToken = this.config.get<string>('INTERNAL_SERVICE_TOKEN');
      const response = await fetch(
        `${this.trackingUrl}/tracking/drivers/${driverId}/location`,
        {
          method: 'GET',
          headers: internalToken
            ? { 'X-Internal-Token': internalToken }
            : undefined,
        },
      );
      if (!response.ok) {
        return undefined;
      }
      const json = (await response.json()) as DriverLocation | null;
      if (!json || typeof json.lat !== 'number' || typeof json.lng !== 'number') {
        return undefined;
      }
      return json;
    } catch (e: any) {
      this.logger.warn(
        `Failed to fetch driver ${driverId} location: ${e?.message ?? e}`,
      );
      return undefined;
    }
  }
}
