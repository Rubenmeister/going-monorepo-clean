import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeoPoint,
  IRoutingProvider,
  RouteResult,
  haversineKm,
} from './routing-provider.port';

/**
 * OsrmRoutingProvider — adapter para Open Source Routing Machine.
 *
 * Config vía env:
 *   OSRM_BASE_URL  (default: https://router.project-osrm.org — servidor
 *                   público, rate limited, OK para dev; en prod conviene
 *                   auto-hospedar en GCE con datos de OSM Ecuador)
 *   OSRM_TIMEOUT_MS (default: 4000)
 *
 * Si OSRM falla (timeout, 5xx, red), cae a Haversine × 1.3 como
 * aproximación de carretera y marca `fallback: true`. NUNCA lanza.
 */
@Injectable()
export class OsrmRoutingProvider implements IRoutingProvider {
  private readonly logger = new Logger(OsrmRoutingProvider.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  /** Multiplicador aplicado a la distancia geodésica cuando OSRM falla. */
  private readonly roadFactor = 1.3;
  /** Velocidad promedio (km/h) para estimar duración en el fallback. */
  private readonly avgSpeedKmh = 40;

  constructor(config: ConfigService) {
    this.baseUrl =
      config.get<string>('OSRM_BASE_URL') ||
      'https://router.project-osrm.org';
    this.timeoutMs = parseInt(
      config.get<string>('OSRM_TIMEOUT_MS') ?? '4000',
      10,
    );
  }

  async route(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult> {
    const path =
      `/route/v1/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?overview=false`;
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        throw new Error(`OSRM HTTP ${res.status}`);
      }
      const data: any = await res.json();
      if (data.code !== 'Ok' || !data.routes?.[0]) {
        throw new Error(`OSRM code=${data.code ?? 'unknown'}`);
      }
      const r = data.routes[0];
      return {
        distanceKm: Math.round((r.distance / 1000) * 100) / 100,
        durationMinutes: Math.round((r.duration / 60) * 10) / 10,
        provider: 'osrm',
      };
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      this.logger.warn(
        `OSRM falló (${msg}). Usando fallback Haversine × ${this.roadFactor}.`,
      );
      return this.haversineFallback(origin, destination);
    } finally {
      clearTimeout(timer);
    }
  }

  private haversineFallback(origin: GeoPoint, destination: GeoPoint): RouteResult {
    const straight = haversineKm(origin, destination);
    const distanceKm = Math.round(straight * this.roadFactor * 100) / 100;
    const durationMinutes =
      Math.round((distanceKm / this.avgSpeedKmh) * 60 * 10) / 10;
    return {
      distanceKm,
      durationMinutes,
      provider: 'haversine',
      fallback: true,
    };
  }
}
