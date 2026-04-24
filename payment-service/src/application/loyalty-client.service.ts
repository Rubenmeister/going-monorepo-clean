import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * LoyaltyClient — cliente HTTP para acreditar puntos al completar un
 * viaje/envío.
 *
 * Llama al endpoint interno de user-auth-service (X-Internal-Token).
 * Es fire-and-forget: si falla, lo loguea pero NO bloquea la
 * confirmación del pago. Los puntos no son críticos para la transacción.
 *
 * Idempotencia: usamos `referenceId = "ride:<tripId>"` para que el
 * caller pueda reintentar sin duplicar acreditación.
 */
@Injectable()
export class LoyaltyClient {
  private readonly logger = new Logger(LoyaltyClient.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('USER_AUTH_SERVICE_URL') ||
      'http://localhost:3001';
    this.token = this.config.get<string>('INTERNAL_SERVICE_TOKEN') || '';
  }

  async awardPointsForRide(args: {
    userId: string;
    amountUsd: number;
    tripId: string;
  }): Promise<void> {
    if (!this.token) {
      this.logger.warn(
        'INTERNAL_SERVICE_TOKEN no configurado — saltando award de puntos',
      );
      return;
    }
    const points = Math.floor(args.amountUsd);
    if (points <= 0) return;

    try {
      const url = `${this.baseUrl.replace(/\/$/, '')}/auth/internal/points/award`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.token,
        },
        body: JSON.stringify({
          userId: args.userId,
          points,
          referenceId: `ride:${args.tripId}`,
        }),
        // Timeout vía AbortController.
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(
          `Award puntos respondió HTTP ${res.status}: ${body.slice(0, 200)}`,
        );
        return;
      }

      this.logger.log(
        `+${points} puntos → user ${args.userId} (ride ${args.tripId})`,
      );
    } catch (e) {
      this.logger.warn(
        `Award puntos falló: ${(e as Error).message}. Continuando sin acreditar.`,
      );
    }
  }
}
