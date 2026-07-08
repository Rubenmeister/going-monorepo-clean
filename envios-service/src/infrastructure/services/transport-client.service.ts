import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AttachParcelResult {
  attached: boolean;
  scheduledTripId?: string;
  driverId?: string;
  departureAt?: string;
}

/**
 * TransportClientService — HTTP client de envios-service hacia transport-service.
 *
 * Usado para adjuntar un envío interurbano a una salida de carpooling programada
 * (POST /scheduled-trips/attach-parcel). Servicio a servicio (VPC-trusted), igual
 * patrón que el webhook interno de pagos.
 *
 * Best-effort: si transport-service no responde o no hay salida con cupo,
 * devolvemos { attached: false } y el caller hace fallback a despacho on-demand.
 */
@Injectable()
export class TransportClientService {
  private readonly logger = new Logger(TransportClientService.name);
  private readonly transportUrl: string;

  constructor(private readonly config: ConfigService) {
    this.transportUrl =
      this.config.get<string>('TRANSPORT_SERVICE_URL') ||
      'http://localhost:3002';
  }

  async attachParcel(input: {
    originCity: string;
    destCity: string;
    isOverVolume?: boolean;
  }): Promise<AttachParcelResult> {
    try {
      const res = await fetch(`${this.transportUrl}/scheduled-trips/attach-parcel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // S2S: el endpoint interno de transport exige este token (auditoría #20).
          'x-internal-token': this.config.get<string>('INTERNAL_SERVICE_TOKEN') ?? '',
        },
        body: JSON.stringify({
          originCity: input.originCity,
          destCity: input.destCity,
          isOverVolume: input.isOverVolume ?? false,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return { attached: false };
      return (await res.json()) as AttachParcelResult;
    } catch (e) {
      this.logger.warn(
        `attach-parcel a transport-service falló: ${(e as Error).message}`,
      );
      return { attached: false };
    }
  }
}
