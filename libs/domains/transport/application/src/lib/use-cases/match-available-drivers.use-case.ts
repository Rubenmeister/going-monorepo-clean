import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  RideMatch,
  IRideMatchRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { Redis } from 'ioredis';

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
    private readonly redis: Redis
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

    // Step 2: Load availability data and filter
    const filteredDrivers: DriverInfo[] = [];

    for (const [driverId, distStr] of nearbyRaw) {
      if (filteredDrivers.length >= limit) break;

      const availability = await this.redis.hgetall(
        `${AVAILABILITY_KEY}:${driverId}`
      );

      // Skip drivers that are not online
      if (!availability || availability.status !== 'online') continue;

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
        rating: parseFloat(availability.rating || '4.5'),
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
        `No online drivers match criteria for ride ${dto.rideId}`
      );
      return err(new Error('No available drivers match the criteria'));
    }

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
