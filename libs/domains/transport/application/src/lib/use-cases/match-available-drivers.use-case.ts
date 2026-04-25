import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  RideMatch,
  IRideMatchRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { Redis } from 'ioredis';
import { FindZonesContainingPointUseCase } from './zone/find-zones-containing-point.use-case';
import {
  FindDriversNearBaseUseCase,
  DriverWithBaseProximity,
} from './driver-base/find-drivers-near-base.use-case';

export interface DriverInfo {
  driverId: UUID;
  name: string;
  rating: number;
  acceptanceRate: number;
  vehicleType: string;
  vehicleNumber?: string;
  photoUrl?: string;
  distance: number;
  eta: number;
}

export interface MatchAvailableDriversDto {
  rideId: UUID;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  vehicleType: string;
  maxRadius?: number;
  limit?: number;
}

export interface MatchResultDto {
  rideId: UUID;
  matchingId: UUID;
  status: string;
  matches: Array<{
    matchId: UUID;
    driverId: UUID;
    driverName: string;
    rating: number;
    acceptanceRate: number;
    distance: number;
    eta: number;
    vehicleType: string;
    vehicleNumber?: string;
  }>;
  matchCount: number;
  expiresAt: Date;
}

/** Redis keys shared with tracking-service */
const GEO_KEY = 'going:drivers:locations';
const AVAILABILITY_KEY = 'going:driver_availability';
const AVERAGE_SPEED_KMH = 40;

@Injectable()
export class MatchAvailableDriversUseCase {
  private readonly logger = new Logger(MatchAvailableDriversUseCase.name);

  constructor(
    @Inject(IRideMatchRepository)
    private readonly rideMatchRepo: IRideMatchRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    /**
     * Opcional — si el servicio aún no configura zonas, el matching
     * funciona igual que antes (sin gating por geocercas).
     */
    @Optional()
    private readonly findZonesContainingPoint?: FindZonesContainingPointUseCase,
    /**
     * Opcional — si el servicio aún no configura bases, el matching
     * cae al GEORADIUS clásico por GPS actual.
     */
    @Optional()
    private readonly findDriversNearBase?: FindDriversNearBaseUseCase,
  ) {}

  async execute(
    dto: MatchAvailableDriversDto
  ): Promise<Result<MatchResultDto, Error>> {
    const maxRadius = dto.maxRadius || 5;
    const limit = dto.limit || 10;
    const matchingId = `matching_${Date.now()}` as UUID;

    this.logger.log(
      `Matching ride ${dto.rideId} — vehicle: ${dto.vehicleType}, radius: ${maxRadius}km`
    );

    // Step 0: (opcional) gating por geocercas — rechazar pickup en
    // zonas `no_service` ANTES de consultar Redis. No gateamos por
    // service_area para no bloquear mientras el admin configura zonas
    // iniciales; el admin puede crear no_service zones para excluir
    // áreas específicas.
    if (this.findZonesContainingPoint) {
      try {
        const zoneCheck = await this.findZonesContainingPoint.execute(
          dto.pickupLongitude,
          dto.pickupLatitude,
        );
        if (zoneCheck.blockedByNoService) {
          this.logger.warn(
            `Ride ${dto.rideId} rechazado — pickup en zona no_service`,
          );
          return err(new Error('El pickup está en una zona sin servicio'));
        }
        // Log priority zones para trazabilidad (FareEngine aplica el
        // surcharge por separado leyendo zoneCheck.totalSurchargePct).
        if (zoneCheck.totalSurchargePct > 0) {
          this.logger.log(
            `Ride ${dto.rideId} pickup en zona priority +${(zoneCheck.totalSurchargePct * 100).toFixed(0)}%`,
          );
        }
      } catch (e) {
        // Si el check falla, no bloqueamos el matching (degradación gentil).
        this.logger.warn(
          `Zone pre-check falló para ride ${dto.rideId}: ${(e as Error).message}`,
        );
      }
    }

    // Step 1: Query Redis GEO for drivers within radius
    const nearbyRaw = (await this.redis.georadius(
      GEO_KEY,
      dto.pickupLongitude,
      dto.pickupLatitude,
      maxRadius,
      'km',
      'WITHDIST',
      'ASC',
      'COUNT',
      limit * 3 // over-fetch to allow filtering by vehicleType & availability
    )) as Array<[string, string]>;

    if (!nearbyRaw || nearbyRaw.length === 0) {
      this.logger.warn(`No drivers found in Redis GEO for ride ${dto.rideId}`);
      return err(new Error('No available drivers found nearby'));
    }

    // Step 2: Load availability data and filter by rating + vehicle type
    const minRating = 4.0; // Minimum acceptable driver rating
    const filteredDrivers: DriverInfo[] = [];

    for (const [driverId, distStr] of nearbyRaw) {
      if (filteredDrivers.length >= limit) break;

      const availability = await this.redis.hgetall(
        `${AVAILABILITY_KEY}:${driverId}`
      );

      // Skip drivers that are not online
      if (!availability || availability.status !== 'online') continue;

      // Extract and validate driver rating (filter by minimum rating)
      const driverRating = parseFloat(availability.rating || '4.5');
      if (driverRating < minRating) {
        this.logger.debug(
          `Skipping driver ${driverId}: rating ${driverRating} below minimum ${minRating}`
        );
        continue;
      }

      // Filter by vehicle type (skip if mismatch and vehicleType is not ANY)
      const driverServiceTypes: string[] = JSON.parse(
        availability.serviceTypes || '["standard"]'
      );
      const vehicleMatch =
        dto.vehicleType === 'ANY' ||
        driverServiceTypes.includes(dto.vehicleType.toLowerCase());
      if (!vehicleMatch) continue;

      const distanceKm = parseFloat(distStr);
      const etaMinutes = Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60);

      filteredDrivers.push({
        driverId: driverId as UUID,
        name: availability.firstName
          ? `${availability.firstName} ${availability.lastName || ''}`.trim()
          : `Conductor ${driverId.slice(-4)}`,
        rating: driverRating,
        acceptanceRate: parseFloat(availability.acceptanceRate || '0.9'),
        vehicleType: availability.vehicleType || dto.vehicleType,
        vehicleNumber: availability.vehiclePlate,
        photoUrl: availability.photoUrl,
        distance: distanceKm,
        eta: etaMinutes,
      });
    }

    if (filteredDrivers.length === 0) {
      this.logger.warn(
        `No online drivers match criteria (rating >= ${minRating}) for ride ${dto.rideId}`
      );
      return err(new Error('No available drivers match the criteria'));
    }

    // Step 2b: si tenemos sistema de bases configurado, OBTENEMOS qué
    // drivers tienen su base ≤ N km del pickup → reciben prioridad
    // sobre drivers que sólo están cerca por GPS actual.
    let baseNearbyDriverIds = new Set<string>();
    let baseDistanceByDriver = new Map<string, number>();
    if (this.findDriversNearBase) {
      try {
        const nearBase: DriverWithBaseProximity[] =
          await this.findDriversNearBase.execute({
            lat: dto.pickupLatitude,
            lng: dto.pickupLongitude,
            maxKm: 10,
            maxResults: 30,
            onlyInShift: true, // sólo prioriza si está en su turno
          });
        for (const d of nearBase) {
          baseNearbyDriverIds.add(d.driverId);
          // Si un driver tiene varias bases, quedamos con la más cercana.
          const prev = baseDistanceByDriver.get(d.driverId) ?? Infinity;
          if (d.distanceKm < prev) {
            baseDistanceByDriver.set(d.driverId, d.distanceKm);
          }
        }
        this.logger.log(
          `Ride ${dto.rideId}: ${baseNearbyDriverIds.size} drivers con base ≤10km del pickup (priorizan)`,
        );
      } catch (e) {
        this.logger.warn(
          `findDriversNearBase falló para ride ${dto.rideId}: ${(e as Error).message}`,
        );
      }
    }

    // Step 2c: Sort drivers
    //   1) Drivers con base cercana van PRIMERO (independientemente de
    //      su GPS actual — la base define la zona de operación).
    //   2) Dentro de cada grupo: rating DESC, luego distance GPS ASC.
    filteredDrivers.sort((a, b) => {
      const aHasBase = baseNearbyDriverIds.has(a.driverId);
      const bHasBase = baseNearbyDriverIds.has(b.driverId);
      if (aHasBase !== bHasBase) return aHasBase ? -1 : 1;
      const ratingDiff = b.rating - a.rating;
      return ratingDiff !== 0 ? ratingDiff : a.distance - b.distance;
    });

    // Step 3: Create RideMatch entities and persist
    const matches: RideMatch[] = [];
    const ttl = 120; // 2 minutes

    for (const driver of filteredDrivers) {
      const matchResult = RideMatch.create({
        rideId: dto.rideId,
        driverId: driver.driverId,
        distance: driver.distance,
        eta: driver.eta,
        driverInfo: {
          name: driver.name,
          rating: driver.rating,
          acceptanceRate: driver.acceptanceRate,
          vehicleType: driver.vehicleType,
          vehicleNumber: driver.vehicleNumber,
          photoUrl: driver.photoUrl,
        },
        ttlSeconds: ttl,
      });

      if (matchResult.isErr()) {
        this.logger.warn(
          `Failed to create match for driver ${driver.driverId}: ${matchResult.error.message}`
        );
        continue;
      }

      const saveResult = await this.rideMatchRepo.save(matchResult.value);
      if (saveResult.isErr()) {
        this.logger.error(`Failed to save match: ${saveResult.error.message}`);
        continue;
      }

      matches.push(matchResult.value);
    }

    const result: MatchResultDto = {
      rideId: dto.rideId,
      matchingId,
      status: 'MATCHING',
      matches: matches.map((match) => ({
        matchId: match.id,
        driverId: match.driverId,
        driverName: match.driverInfo.name,
        rating: match.driverInfo.rating,
        acceptanceRate: match.driverInfo.acceptanceRate,
        distance: match.distance,
        eta: match.eta,
        vehicleType: match.driverInfo.vehicleType,
        vehicleNumber: match.driverInfo.vehicleNumber,
      })),
      matchCount: matches.length,
      expiresAt: matches[0]?.expiresAt || new Date(Date.now() + ttl * 1000),
    };

    this.logger.log(
      `Matched ${matches.length} real drivers for ride ${dto.rideId}`
    );
    return ok(result);
  }
}
