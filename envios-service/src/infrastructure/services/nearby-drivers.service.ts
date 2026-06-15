import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const DRIVERS_GEO_KEY = 'going:drivers:locations';
const DRIVER_AVAILABILITY_PREFIX = 'going:driver_availability:';

/**
 * Velocidad promedio para estimar ETA. 40 km/h alinea con transport-service.
 */
const AVERAGE_SPEED_KMH = 40;

export interface RankedDriver {
  driverId: string;
  name: string;
  rating: number;
  acceptanceRate: number;
  vehicleType: string;
  vehiclePlate?: string;
  photoUrl?: string;
  distanceKm: number;
  etaMinutes: number;
}

export interface FindRankedDriversOptions {
  radiusKm?: number;
  maxResults?: number;
  minRating?: number;
  /**
   * Filtra por clase de vehículo del conductor.
   * Envíos: ['suv','suv_xl'] (única flota que hace servicio compartido).
   * Si se omite o incluye 'any', no se filtra por clase.
   */
  vehicleTypes?: string[];
}

@Injectable()
export class NearbyDriversService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NearbyDriversService.name);
  private redis!: Redis;
  /** Token Mapbox para ETA con tráfico (opcional — sin él se usa el estimado estático). */
  private mapboxToken?: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.mapboxToken =
      this.config.get<string>('MAPBOX_TOKEN') ||
      this.config.get<string>('MAPBOX_ACCESS_TOKEN') ||
      undefined;
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redis = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      connectTimeout: 3000,
    });
    this.redis.on('error', (e) =>
      this.logger.warn(`Redis error: ${e.message}`)
    );
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  /**
   * Lista plana de IDs de conductores online dentro del radio.
   * Mantenida por compatibilidad con callers viejos.
   */
  async findNearbyOnlineDrivers(
    latitude: number,
    longitude: number,
    radiusKm = 10,
    maxResults = 10
  ): Promise<string[]> {
    const ranked = await this.findRankedDrivers(latitude, longitude, {
      radiusKm,
      maxResults,
      minRating: 0, // backwards compat: sin filtro
    });
    return ranked.map((d) => d.driverId);
  }

  /**
   * Consulta Redis GEO + availability hashes, filtra por rating + tipo de
   * vehículo y devuelve conductores ordenados por rating (desc) y distancia
   * (asc). Usa el mismo contrato que transport-service para mantener paridad.
   */
  async findRankedDrivers(
    latitude: number,
    longitude: number,
    opts: FindRankedDriversOptions = {}
  ): Promise<RankedDriver[]> {
    const {
      radiusKm = 10,
      maxResults = 10,
      minRating = 4.0,
      vehicleTypes,
    } = opts;

    try {
      // Sobre-fetcheamos 3× para tener margen al filtrar por rating y tipo.
      const results = (await (this.redis as any).georadius(
        DRIVERS_GEO_KEY,
        longitude,
        latitude,
        radiusKm,
        'km',
        'WITHDIST',
        'WITHCOORD',
        'ASC',
        'COUNT',
        maxResults * 3
      )) as Array<[string, string, [string, string]]>;

      if (!results || results.length === 0) return [];

      const vehicleFilter = (vehicleTypes ?? []).map((v) => v.toLowerCase());
      const filterAnyVehicle =
        vehicleFilter.length === 0 || vehicleFilter.includes('any');

      const ranked: RankedDriver[] = [];
      const coordsByDriver = new Map<string, [number, number]>();
      for (const [driverId, distStr, coord] of results) {
        if (ranked.length >= maxResults) break;
        coordsByDriver.set(driverId, [
          parseFloat(coord?.[0] ?? 'NaN'),
          parseFloat(coord?.[1] ?? 'NaN'),
        ]);

        const availability = await this.redis.hgetall(
          `${DRIVER_AVAILABILITY_PREFIX}${driverId}`
        );

        // Sin availability = no sabemos si está online → skip por seguridad.
        if (!availability || availability.status !== 'online') continue;

        const rating = parseFloat(availability.rating || '4.5');
        if (rating < minRating) continue;

        // Clase de vehículo del conductor. La flota de servicio compartido de
        // Going es SUV/SUV XL → default 'suv' si la disponibilidad aún no la
        // trae (conductores conectados antes de este cambio).
        const driverVehicleClass = (availability.vehicleClass || 'suv').toLowerCase();
        if (!filterAnyVehicle && !vehicleFilter.includes(driverVehicleClass)) {
          continue;
        }

        const distanceKm = parseFloat(distStr);
        const etaMinutes = Math.max(
          1,
          Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60)
        );

        ranked.push({
          driverId,
          name: availability.firstName
            ? `${availability.firstName} ${availability.lastName || ''}`.trim()
            : `Conductor ${driverId.slice(-4)}`,
          rating,
          acceptanceRate: parseFloat(availability.acceptanceRate || '0.9'),
          vehicleType: availability.vehicleClass || availability.vehicleType || 'suv',
          vehiclePlate: availability.vehiclePlate,
          photoUrl: availability.photoUrl,
          distanceKm,
          etaMinutes,
        });
      }

      // Orden final: mejor rating primero, a igualdad de rating el más cercano.
      ranked.sort((a, b) => {
        const d = b.rating - a.rating;
        return d !== 0 ? d : a.distanceKm - b.distanceKm;
      });

      // ETA con tráfico real (Mapbox driving-traffic): mejora etaMinutes en
      // sitio. Si no hay token o Mapbox falla, queda el estimado estático.
      await this.applyTrafficEta(ranked, coordsByDriver, longitude, latitude);

      return ranked;
    } catch (e) {
      this.logger.warn(`Redis GEO query failed: ${(e as Error).message}`);
      return [];
    }
  }

  /**
   * Reemplaza etaMinutes por la duración real CON TRÁFICO de Mapbox Matrix
   * (perfil driving-traffic) en UNA sola llamada para todos los candidatos.
   * El perfil driving-traffic admite máx 10 coordenadas → usamos hasta 9
   * conductores + el punto de recogida. Robusto: sin token o ante cualquier
   * fallo (timeout, HTTP, shape), deja el etaMinutes estático — nunca rompe
   * el ranking ni bloquea el dispatch (timeout 2.5s).
   */
  private async applyTrafficEta(
    drivers: RankedDriver[],
    coordsByDriver: Map<string, [number, number]>,
    pickupLng: number,
    pickupLat: number,
  ): Promise<void> {
    if (!this.mapboxToken || drivers.length === 0) return;

    const subset = drivers.slice(0, 9).filter((d) => {
      const c = coordsByDriver.get(d.driverId);
      return c && Number.isFinite(c[0]) && Number.isFinite(c[1]);
    });
    if (subset.length === 0) return;

    const coords = subset
      .map((d) => {
        const c = coordsByDriver.get(d.driverId)!;
        return `${c[0]},${c[1]}`;
      })
      .concat(`${pickupLng},${pickupLat}`)
      .join(';');
    const destIdx = subset.length; // la recogida es la última coordenada
    const sources = subset.map((_, i) => i).join(';');
    const url =
      `https://api.mapbox.com/directions-matrix/v1/mapbox/driving-traffic/${coords}` +
      `?sources=${sources}&destinations=${destIdx}&annotations=duration` +
      `&access_token=${this.mapboxToken}`;

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) {
        this.logger.warn(`Mapbox Matrix HTTP ${res.status} — uso ETA estático`);
        return;
      }
      const data: any = await res.json();
      const durations: Array<Array<number | null>> | undefined = data?.durations;
      if (!Array.isArray(durations)) return;
      subset.forEach((d, i) => {
        const secs = durations[i]?.[0];
        if (typeof secs === 'number' && secs > 0) {
          d.etaMinutes = Math.max(1, Math.round(secs / 60));
        }
      });
    } catch (e) {
      this.logger.warn(`Mapbox traffic ETA falló — ETA estático: ${(e as Error).message}`);
    }
  }
}
