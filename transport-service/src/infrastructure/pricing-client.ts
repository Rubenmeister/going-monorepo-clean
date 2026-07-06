import { Injectable, Logger } from '@nestjs/common';

/**
 * PricingClient — consulta el motor de tarifas (`pricing-service`) en runtime.
 *
 * F2 (migración incremental y REVERSIBLE): reemplaza los `getFare(o,d)` locales
 * por una consulta al motor, para que editar una tarifa en Atlas se refleje en
 * vivo. Seguridad:
 *  - Si `PRICING_SERVICE_URL` no está seteado → usa SIEMPRE el fallback local
 *    (el servicio se comporta igual que antes; migración opt-in por env).
 *  - Si el motor falla/tarda (timeout) → cae al fallback local (cero regresión).
 *  - Shadow: si el motor y el local difieren, lo LOGUEA (detecta divergencias /
 *    confirma que una edición en Atlas tomó efecto).
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
   * Tarifa por asiento (shared_seat) del motor; `localFallback` es el
   * `getFare(o,d)` de siempre. Devuelve el valor del motor, o el local si el
   * motor no está disponible.
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
      const data = (await res.json()) as { total?: number; error?: string };
      const remote = typeof data?.total === 'number' ? data.total : null;
      if (remote == null) return local; // el motor no tiene esa ruta → local
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

  /**
   * Precio COMPLETO del motor para un serviceType (intercity_private, urban_ride,
   * etc.) → el motor aplica su lista de servicio (privado/empresas/urbano) + surge.
   * `localFallback` = el cálculo actual de libs/pricing. Devuelve el total del
   * motor, o el local si el motor no responde. `label` solo para el shadow-log.
   */
  async fullPrice(
    body: Record<string, unknown>,
    localFallback: () => number | null,
    label = '',
  ): Promise<number | null> {
    const local = localFallback();
    if (!this.enabled) return local;
    try {
      const res = await fetch(`${this.baseUrl}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) throw new Error(`/price ${res.status}`);
      const data = (await res.json()) as { total?: number; error?: string };
      const remote = typeof data?.total === 'number' ? data.total : null;
      if (remote == null) return local;
      if (local != null && remote !== local) {
        this.logger.warn(`[pricing-drift] ${label}: motor=${remote} local=${local} (usando motor)`);
      }
      return remote;
    } catch (e) {
      this.logger.debug(`pricing fullPrice fallback ${label}: ${(e as Error).message}`);
      return local;
    }
  }
}
