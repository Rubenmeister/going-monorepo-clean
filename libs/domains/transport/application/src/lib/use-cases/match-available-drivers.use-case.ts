import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import {
  RideMatch,
  IRideMatchRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

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

@Injectable()
export class MatchAvailableDriversUseCase {
  private readonly logger = new Logger(MatchAvailableDriversUseCase.name);

  // Mock driver data - In production, this would come from a driver location service
  private mockDrivers: DriverInfo[] = [
    {
      driverId: 'driver_1' as UUID,
      name: 'John Doe',
      rating: 4.8,
      acceptanceRate: 0.95,
      vehicleType: 'ECONOMY',
      vehicleNumber: 'ABC123',
      photoUrl: 'https://example.com/driver1.jpg',
      distance: 0.5,
      eta: 2,
    },
    {
      driverId: 'driver_2' as UUID,
      name: 'Jane Smith',
      rating: 4.9,
      acceptanceRate: 0.92,
      vehicleType: 'ECONOMY',
      vehicleNumber: 'XYZ789',
      photoUrl: 'https://example.com/driver2.jpg',
      distance: 1.2,
      eta: 5,
    },
    {
      driverId: 'driver_3' as UUID,
      name: 'Mike Johnson',
      rating: 4.7,
      acceptanceRate: 0.88,
      vehicleType: 'PREMIUM',
      vehicleNumber: 'LUX456',
      photoUrl: 'https://example.com/driver3.jpg',
      distance: 1.5,
      eta: 6,
    },
    {
      driverId: 'driver_4' as UUID,
      name: 'Sarah Williams',
      rating: 4.6,
      acceptanceRate: 0.91,
      vehicleType: 'ECONOMY',
      vehicleNumber: 'ECO321',
      photoUrl: 'https://example.com/driver4.jpg',
      distance: 0.8,
      eta: 3,
    },
    {
      driverId: 'driver_5' as UUID,
      name: 'Tom Brown',
      rating: 4.5,
      acceptanceRate: 0.85,
      vehicleType: 'SHARED',
      vehicleNumber: 'SHR654',
      photoUrl: 'https://example.com/driver5.jpg',
      distance: 2.0,
      eta: 8,
    },
  ];

  constructor(
    @Inject(IRideMatchRepository)
    private readonly rideMatchRepo: IRideMatchRepository
  ) {}

  async execute(
    dto: MatchAvailableDriversDto
  ): Promise<Result<MatchResultDto, Error>> {
    const maxRadius = dto.maxRadius || 5; // kilometers
    const limit = dto.limit || 10;
    const matchingId = `matching_${Date.now()}` as UUID;

    this.logger.log(
      `Starting ride matching for ride ${dto.rideId}, vehicle: ${dto.vehicleType}, radius: ${maxRadius}km`
    );

    // Step 1: Filter drivers by criteria (in production, use geospatial queries)
    const filteredDrivers = this.filterDrivers(
      dto.vehicleType,
      maxRadius,
      limit
    );

    if (filteredDrivers.length === 0) {
      this.logger.warn(`No available drivers found for ride ${dto.rideId}`);
      return err(new Error('No available drivers found'));
    }

    // Step 2: Create RideMatch entities for each filtered driver
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

      matches.push(matchResult.value);
    }

    // Step 3: Save all matches to repository
    for (const match of matches) {
      const saveResult = await this.rideMatchRepo.save(match);
      if (saveResult.isErr()) {
        this.logger.error(`Failed to save match: ${saveResult.error.message}`);
      }
    }

    // Step 4: Build response
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
      `Found ${matches.length} available drivers for ride ${dto.rideId}`
    );
    return ok(result);
  }

  private filterDrivers(
    vehicleType: string,
    maxRadius: number,
    limit: number
  ): DriverInfo[] {
    return this.mockDrivers
      .filter((driver) => {
        // Filter by vehicle type
        if (vehicleType !== 'ANY' && driver.vehicleType !== vehicleType) {
          return false;
        }
        // Filter by radius
        if (driver.distance > maxRadius) {
          return false;
        }
        // Filter by minimum rating (4.0 stars)
        if (driver.rating < 4.0) {
          return false;
        }
        // Filter by acceptance rate (>85%)
        if (driver.acceptanceRate < 0.85) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by: distance (ascending), then rating (descending), then acceptance rate (descending)
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        if (a.rating !== b.rating) {
          return b.rating - a.rating;
        }
        return b.acceptanceRate - a.acceptanceRate;
      })
      .slice(0, limit);
  }
}
