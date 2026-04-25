import {
  Inject,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  IZoneRepository,
  Zone,
  ZoneKind,
} from '@going-monorepo-clean/domains-transport-core';

export interface ZoneMatchResult {
  /** Todas las zonas activas que contienen el punto. */
  zones: Zone[];
  /** Indica si al menos una service_area cubre el punto. */
  inServiceArea: boolean;
  /** Indica si alguna no_service bloquea el punto. */
  blockedByNoService: boolean;
  /** Suma total de surcharges acumulados por zonas priority (ej. 0.15). */
  totalSurchargePct: number;
  /** Zonas de tipo restricted que el caller debe validar con driver. */
  restrictedZones: Zone[];
}

/**
 * FindZonesContainingPoint — evalúa un punto contra todas las zonas
 * administradas y devuelve un resumen agregado.
 *
 * Usado por:
 *   - MatchAvailableDrivers antes de buscar conductores (validar cobertura)
 *   - FareEngine para aplicar surcharges de priority zones
 *   - Mobile apps para mostrar "fuera de zona de servicio" ANTES de pedir
 *
 * La detección point-in-polygon usa algoritmo ray-casting implementado
 * localmente (sin dependencia externa) — suficiente para polygons simples
 * convexos o mildly cóncavos. Para polygons complejos con agujeros,
 * reemplazar por @turf/boolean-point-in-polygon.
 */
@Injectable()
export class FindZonesContainingPointUseCase {
  private readonly logger = new Logger(FindZonesContainingPointUseCase.name);

  constructor(
    @Inject(IZoneRepository)
    private readonly zoneRepo: IZoneRepository,
  ) {}

  async execute(lng: number, lat: number): Promise<ZoneMatchResult> {
    if (
      typeof lng !== 'number' ||
      lng < -180 ||
      lng > 180 ||
      typeof lat !== 'number' ||
      lat < -90 ||
      lat > 90
    ) {
      throw new BadRequestException('lat/lng out of range');
    }

    const repoResult = await this.zoneRepo.findContainingPoint(lng, lat);
    if (repoResult.isErr()) {
      this.logger.error(
        `findContainingPoint(${lng},${lat}) failed: ${repoResult.error.message}`,
      );
      throw new InternalServerErrorException(repoResult.error.message);
    }

    // Doble-check in-memory: por si el repo usa un filtro grueso (ej.
    // bounding box Mongo) y no valida ray-casting exacto.
    const exactlyContaining = repoResult.value.filter((z) =>
      pointInPolygon(lng, lat, z.polygon) && z.active,
    );

    const byKind = (k: ZoneKind) => exactlyContaining.filter((z) => z.kind === k);

    const serviceAreas = byKind('service_area');
    const noService = byKind('no_service');
    const priority = byKind('priority');
    const restricted = byKind('restricted');

    const totalSurchargePct = priority.reduce(
      (acc, z) => acc + (z.surchargePct ?? 0),
      0,
    );

    return {
      zones: exactlyContaining,
      inServiceArea: serviceAreas.length > 0,
      blockedByNoService: noService.length > 0,
      totalSurchargePct,
      restrictedZones: restricted,
    };
  }
}

/**
 * Ray-casting point-in-polygon. Polygon como array cerrado [lng,lat].
 * O(n) sobre los vertices — suficiente para ~10-20 zonas con polygons
 * de <50 vertices cada uno.
 */
function pointInPolygon(
  lng: number,
  lat: number,
  polygon: Array<[number, number]>,
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
