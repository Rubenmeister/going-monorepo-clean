import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildInternalServiceHeaders } from '@going-monorepo-clean/shared-infrastructure';

export interface RidePaymentContext {
  tripId: string;
  passengerId: string | null;
  driverId: string | null;
  status: string | null;
  amount: number;
}

/**
 * TransportClient — consulta a transport-service el contexto AUTORITATIVO de un
 * viaje para NO confiar en amount/driverId que el cliente manda en
 * POST /payments/process (auditoría B1 #1). S2S con x-internal-token + firma HMAC.
 */
@Injectable()
export class TransportClient {
  private readonly logger = new Logger(TransportClient.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('TRANSPORT_SERVICE_URL') || 'http://localhost:3005';
    this.token = this.config.get<string>('INTERNAL_SERVICE_TOKEN') || '';
  }

  /**
   * Devuelve el contexto de pago del viaje, o null si no existe / no se puede
   * consultar. El caller decide la política (rechazar el pago si null).
   */
  async getPaymentContext(tripId: string): Promise<RidePaymentContext | null> {
    if (!this.token) {
      this.logger.error('INTERNAL_SERVICE_TOKEN no configurado — no se puede validar el viaje');
      return null;
    }
    try {
      const path = `/rides/${encodeURIComponent(tripId)}/payment-context`;
      const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
      const hmacHeaders = buildInternalServiceHeaders({
        secret: this.token,
        method: 'GET',
        path,
        body: '',
        caller: 'payment-service',
      });
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Internal-Token': this.token,
          'x-internal-token': this.token,
          ...hmacHeaders,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`payment-context de ${tripId} respondió HTTP ${res.status}`);
        return null;
      }
      return (await res.json()) as RidePaymentContext;
    } catch (e) {
      this.logger.warn(`payment-context de ${tripId} falló: ${(e as Error).message}`);
      return null;
    }
  }
}
