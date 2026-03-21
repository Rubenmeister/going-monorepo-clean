/**
 * Location Service
 * Business logic for real-time location tracking and historical analysis
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { LocationRepository } from '../../infrastructure/persistence/location.repository';
import {
  Location,
  LocationUpdate,
  LocationHistory,
} from '../../domain/models/location.model';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(private readonly locationRepository: LocationRepository) {}

  /**
   * Record a new location update from a driver
   * @param companyId Company ID
   * @param update Location update data
   * @returns Saved location
   */
  async recordLocation(
    companyId: string,
    update: LocationUpdate
  ): Promise<Location> {
    if (!update.latitude || !update.longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    if (Math.abs(update.latitude) > 90 || Math.abs(update.longitude) > 180) {
      throw new BadRequestException('Invalid coordinates');
    }

    const location: Partial<Location> = {
      driverId: update.driverId,
      vehicleId: update.vehicleId,
      companyId,
      coordinates: {
        type: 'Point',
        coordinates: [update.longitude, update.latitude],
      },
      metadata: {
        speed: update.speed,
        heading: update.heading,
        accuracy: update.accuracy,
      },
      timestamp: new Date(),
    };

    return this.locationRepository.create(location);
  }

  /**
   * Get current location of a specific driver
   * @param companyId Company ID
   * @param driverId Driver ID
   * @returns Latest location
   */
  async getDriverCurrentLocation(
    companyId: string,
    driverId: string
  ): Promise<Location> {
    const location = await this.locationRepository.getLatest(
      driverId,
      companyId
    );

    if (!location) {
      throw new NotFoundException(`No location found for driver ${driverId}`);
    }

    return location;
  }

  /**
   * Get current locations for all active drivers in a company
   * @param companyId Company ID
   * @returns Array of latest locations
   */
  async getAllDriversCurrentLocations(companyId: string): Promise<Location[]> {
    return this.locationRepository.getAllCurrentLocations(companyId);
  }

  /**
   * Get location history for a driver within time range
   * @param companyId Company ID
   * @param driverId Driver ID
   * @param startTime Start timestamp
   * @param endTime End timestamp
   * @returns Array of locations
   */
  async getLocationHistory(
    companyId: string,
    driverId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Location[]> {
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    return this.locationRepository.getHistory(
      driverId,
      companyId,
      startTime,
      endTime
    );
  }

  /**
   * Get heatmap data - location density by area
   * @param companyId Company ID
   * @param gridSize Grid cell size in meters
   * @returns Array of heat map points
   */
  async getHeatmapData(
    companyId: string,
    gridSize = 1000
  ): Promise<Array<{ lat: number; lng: number; intensity: number }>> {
    try {
      const locations = await this.locationRepository.getAllCurrentLocations(
        companyId,
        10000
      );

      // Group locations into grid cells
      const grid = new Map<string, number>();

      locations.forEach((loc) => {
        const [lon, lat] = loc.coordinates.coordinates;
        const cellX = Math.floor(lon / (gridSize / 111000)); // 1 degree ≈ 111 km
        const cellY = Math.floor(lat / (gridSize / 111000));
        const key = `${cellX},${cellY}`;

        grid.set(key, (grid.get(key) || 0) + 1);
      });

      // Convert grid to heatmap points
      return Array.from(grid.entries()).map(([key, count]) => {
        const [x, y] = key.split(',').map(Number);
        return {
          lat: y * (gridSize / 111000),
          lng: x * (gridSize / 111000),
          intensity: Math.min(count / 10, 1), // Normalize to 0-1
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get heatmap data: ${error}`);
      return [];
    }
  }

  /**
   * Find locations within a geographic radius
   * @param companyId Company ID
   * @param longitude Center longitude
   * @param latitude Center latitude
   * @param radiusMeters Search radius in meters
   * @returns Array of locations within radius
   */
  async findLocationsNearby(
    companyId: string,
    longitude: number,
    latitude: number,
    radiusMeters: number
  ): Promise<Location[]> {
    if (radiusMeters <= 0 || radiusMeters > 50000) {
      throw new BadRequestException(
        'Radius must be between 0 and 50000 meters'
      );
    }

    return this.locationRepository.findWithinRadius(
      longitude,
      latitude,
      radiusMeters,
      companyId
    );
  }

  /**
   * Get trip summary for a driver
   * @param companyId Company ID
   * @param driverId Driver ID
   * @param startTime Trip start
   * @param endTime Trip end
   * @returns Trip summary
   */
  async getTripSummary(
    companyId: string,
    driverId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    driverId: string;
    startTime: Date;
    endTime: Date;
    distance: number;
    duration: number;
    maxSpeed: number;
    avgSpeed: number;
    pointCount: number;
  }> {
    const stats = await this.locationRepository.calculateTripStats(
      driverId,
      companyId,
      startTime,
      endTime
    );

    return {
      driverId,
      startTime,
      endTime,
      ...stats,
    };
  }

  /**
   * Get number of currently active drivers
   * @param companyId Company ID
   * @returns Count of active drivers
   */
  async getActiveDriverCount(companyId: string): Promise<number> {
    return this.locationRepository.getActiveDriverCount(companyId);
  }

  /**
   * Generate route summary from location history
   * @param companyId Company ID
   * @param driverId Driver ID
   * @param startTime Route start
   * @param endTime Route end
   * @returns Route data for visualization
   */
  async getRouteForVisualization(
    companyId: string,
    driverId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    route: Array<{ lat: number; lng: number; timestamp: Date; speed?: number }>;
    summary: {
      distance: number;
      duration: number;
      maxSpeed: number;
      avgSpeed: number;
    };
  }> {
    const locations = await this.getLocationHistory(
      companyId,
      driverId,
      startTime,
      endTime
    );
    const stats = await this.locationRepository.calculateTripStats(
      driverId,
      companyId,
      startTime,
      endTime
    );

    const route = locations.map((loc) => ({
      lat: loc.coordinates.coordinates[1],
      lng: loc.coordinates.coordinates[0],
      timestamp: loc.timestamp,
      speed: loc.metadata?.speed,
    }));

    return {
      route,
      summary: {
        distance: stats.distance,
        duration: stats.duration,
        maxSpeed: stats.maxSpeed,
        avgSpeed: stats.avgSpeed,
      },
    };
  }

  /**
   * Cleanup old location records
   * @param daysOld Delete records older than this many days
   * @returns Number of deleted records
   */
  async cleanupOldRecords(daysOld = 90): Promise<number> {
    const beforeDate = new Date();
    beforeDate.setDate(beforeDate.getDate() - daysOld);

    this.logger.log(
      `Deleting location records older than ${beforeDate.toISOString()}`
    );
    return this.locationRepository.deleteOldRecords(beforeDate);
  }
}
