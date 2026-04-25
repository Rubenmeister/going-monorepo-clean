import {
  Inject,
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IDriverBaseRepository,
  DriverBaseWithDistance,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface FindDriversNearBaseInput {
  lat: number;
  lng: number;
  /** Máxima distancia en km de la BASE al pickup. Default 10. */
  maxKm?: number;
  /** Máximo de drivers a retornar. Default 20. */
  maxResults?: number;
  /** Si true, sólo drivers actualmente en su shift. Default false. */
  onlyInShift?: boolean;
}

export interface DriverWithBaseProximity {
  driverId: UUID;
  baseId: UUID;
  baseName: string;
  baseLat: number;
  baseLng: number;
  /** Distancia base ↔ pickup point. */
  distanceKm: number;
  /** Si la base tiene shift y es la hora correcta. */
  inShift: boolean;
  isPrimary: boolean;
}

/**
 * FindDriversNearBase — devuelve drivers cuya BASE asignada esté
 * cercana al punto consultado, ordenados por distancia.
 *
 * Esta query se hace ANTES del Redis GEORADIUS general en
 * MatchAvailableDrivers para preferir drivers de la zona, aunque
 * estén lejos GPS-actual. Lógica:
 *
 *   1. Driver A tiene base en Quito Norte, ahora circula en Sangolquí.
 *      Llega un pedido en Cumbayá: B (base Cumbayá) gana.
 *   2. Driver B tiene base en Quito Norte, ahora circula en Mariscal.
 *      Llega un pedido en Cotocollao: B gana (su base es Norte aunque
 *      esté lejos GPS-actual).
 *
 * Si ningún driver con base cercana, MatchAvailableDrivers cae al
 * GEORADIUS clásico (drivers más cercanos por GPS actual).
 */
@Injectable()
export class FindDriversNearBaseUseCase {
  private readonly logger = new Logger(FindDriversNearBaseUseCase.name);

  constructor(
    @Inject(IDriverBaseRepository)
    private readonly baseRepo: IDriverBaseRepository,
  ) {}

  async execute(input: FindDriversNearBaseInput): Promise<DriverWithBaseProximity[]> {
    const repoResult = await this.baseRepo.findBasesNearPoint(input.lat, input.lng, {
      maxKm: input.maxKm ?? 10,
      maxResults: input.maxResults ?? 20,
      onlyInShift: input.onlyInShift ?? false,
    });

    if (repoResult.isErr()) {
      this.logger.warn(
        `findBasesNearPoint(${input.lat},${input.lng}) failed: ${repoResult.error.message}`,
      );
      throw new InternalServerErrorException(repoResult.error.message);
    }

    const now = new Date();
    return repoResult.value.map((bd: DriverBaseWithDistance) => ({
      driverId: bd.base.driverId,
      baseId: bd.base.id,
      baseName: bd.base.name,
      baseLat: bd.base.lat,
      baseLng: bd.base.lng,
      distanceKm: bd.distanceKm,
      inShift: bd.base.isInShift(now),
      isPrimary: bd.base.isPrimary,
    }));
  }
}
