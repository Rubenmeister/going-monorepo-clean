import { Injectable, Logger } from '@nestjs/common';

/**
 * PricingClient — consulta el motor de tarifas (`pricing-service`) desde payment.
 *
 * F2b: reemplaza el `getExcelFare(o,d)` local del FareEngine por el motor, para
 * que payment cobre la MISMA tarifa que transport (una sola fuente) y sea
 * editable en vivo. Seguridad idéntica al cliente de transport:
 *  - Sin `PRICING_SERVICE_URL` → usa siempre el fallback local (opt-in por env).
 *  - Motor caído/lento → fallback local (cero regresión).
 *  - Shadow: loguea si motor y local difieren.
 */
@Injectable()
export class PricingClient {
  private readonly logger = new Logger(PricingClient.name);
  private readonly baseUrl = (process.env.PRICING_SERVICE_URL || '').replace(/\/$/, '');
  private readonly timeoutMs = Number(process.env.PRICING_TIMEOUT_MS || 2500);

  get enabled() {
    return !!this.baseUrl;
  }

  /**
   * Tarifa por asiento (shared_seat) del motor. `localFallback` = el
   * getExcelFare(o,d) de siempre. Devuelve el motor, o el local si no disponible.
   */
  async sharedFare(
    origin: string | null | undefined,
    destination: string | null | undefined,
    localFallback: () => number | null,
  ): Promise<number | null> {
    const local = localFallback();
    if (!this.enabled || !origin || !destination) return local;
    try {
      const res = await fetch(`${this.baseUrl}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType: 'shared_seat', origin, destination, seats: 1 }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) throw new Error(`/price ${res.status}`);
      const data = (await res.json()) as { total?: number };
      const remote = typeof data?.total === 'number' ? data.total : null;
      if (remote == null) return local;
      if (local != null && remote !== local) {
        this.logger.warn(
          `[pricing-drift] ${origin}->${destination}: motor=${remote} local=${local} (usando motor)`,
        );
      }
      return remote;
    } catch (e) {
      this.logger.debug(`pricing fallback ${origin}->${destination}: ${(e as Error).message}`);
      return local;
    }
  }
}
