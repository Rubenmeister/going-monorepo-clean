/**
 * Location Repository
 * Handles all database operations for location data
 * Supports real-time tracking and historical queries
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LocationSchema } from '../schemas/location.schema';
import {
  Location,
  LocationUpdate,
  LocationHistory,
} from '../../domain/models/location.model';

@Injectable()
export class LocationRepository {
  private readonly logger = new Logger(LocationRepository.name);

  constructor(
    @InjectModel(LocationSchema.name)
    private readonly locationModel: Model<LocationSchema>
  ) {}

  /**
   * Save a new location record
   * @param location Location data to save
   * @returns Saved location
   */
  async create(location: Partial<Location>): Promise<Location> {
    try {
      const newLocation = new this.locationModel(location);
      const saved = await newLocation.save();
      this.logger.debug(`Location saved for driver ${location.driverId}`);
      return saved.toObject() as Location;
    } catch (error) {
      this.logger.error(`Failed to create location: ${error}`);
      throw error;
    }
  }

  /**
   * Get latest location for a driver
   * @param driverId Driver ID
   * @param companyId Company ID
   * @returns Latest location or null
   */
  async getLatest(
    driverId: string,
    companyId: string
  ): Promise<Location | null> {
    try {
      return await this.locationModel
        .findOne({ driverId, companyId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get latest location: ${error}`);
      return null;
    }
  }

  /**
   * Get all active drivers' current locations for a company
   * @param companyId Company ID
   * @param limit Maximum number of results
   * @returns Array of latest locations
   */
  async getAllCurrentLocations(
    companyId: string,
    limit = 1000
  ): Promise<Location[]> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      return await this.locationModel
        .aggregate([
          {
            $match: {
              companyId,
              timestamp: { $gte: thirtyMinutesAgo },
            },
          },
          {
            $sort: { driverId: 1, timestamp: -1 },
          },
          {
            $group: {
              _id: '$driverId',
              location: { $first: '$$ROOT' },
            },
          },
          {
            $replaceRoot: { newRoot: '$location' },
          },
          {
            $limit: limit,
          },
        ])
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get current locations: ${error}`);
      return [];
    }
  }

  /**
   * Get location history for a driver within time range
   * @param driverId Driver ID
   * @param companyId Company ID
   * @param startTime Start timestamp
   * @param endTime End timestamp
   * @returns Array of locations
   */
  async getHistory(
    driverId: string,
    companyId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Location[]> {
    try {
      return await this.locationModel
        .find({
          driverId,
          companyId,
          timestamp: { $gte: startTime, $lte: endTime },
        })
        .sort({ timestamp: 1 })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get location history: ${error}`);
      return [];
    }
  }

  /**
   * Get locations within a geographic area (radius search)
   * @param longitude Center longitude
   * @param latitude Center latitude
   * @param radiusMeters Search radius in meters
   * @param companyId Company ID filter
   * @returns Array of locations within radius
   */
  async findWithinRadius(
    longitude: number,
    latitude: number,
    radiusMeters: number,
    companyId?: string
  ): Promise<Location[]> {
    try {
      const query: any = {
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusMeters,
          },
        },
      };

      if (companyId) {
        query.companyId = companyId;
      }

      return await this.locationModel.find(query).lean().exec();
    } catch (error) {
      this.logger.error(`Failed to find locations within radius: ${error}`);
      return [];
    }
  }

  /**
   * Get locations for multiple drivers
   * @param driverIds Array of driver IDs
   * @param companyId Company ID
   * @returns Latest locations for all drivers
   */
  async getMultipleDriversLatest(
    driverIds: string[],
    companyId: string
  ): Promise<Location[]> {
    try {
      return await this.locationModel
        .aggregate([
          {
            $match: {
              driverId: { $in: driverIds },
              companyId,
            },
          },
          {
            $sort: { driverId: 1, timestamp: -1 },
          },
          {
            $group: {
              _id: '$driverId',
              location: { $first: '$$ROOT' },
            },
          },
          {
            $replaceRoot: { newRoot: '$location' },
          },
        ])
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get multiple drivers latest: ${error}`);
      return [];
    }
  }

  /**
   * Update existing location (rarely used, locations are mostly immutable)
   * @param locationId Location ID
   * @param updateData Data to update
   * @returns Updated location
   */
  async update(
    locationId: string,
    updateData: Partial<Location>
  ): Promise<Location | null> {
    try {
      return await this.locationModel
        .findByIdAndUpdate(locationId, updateData, { new: true })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to update location: ${error}`);
      return null;
    }
  }

  /**
   * Delete old location records (cleanup)
   * @param beforeDate Delete records before this date
   * @returns Number of deleted records
   */
  async deleteOldRecords(beforeDate: Date): Promise<number> {
    try {
      const result = await this.locationModel.deleteMany({
        timestamp: { $lt: beforeDate },
      });
      this.logger.log(`Deleted ${result.deletedCount} old location records`);
      return result.deletedCount || 0;
    } catch (error) {
      this.logger.error(`Failed to delete old records: ${error}`);
      return 0;
    }
  }

  /**
   * Count active drivers in company
   * @param companyId Company ID
   * @param sinceMinutesAgo Consider only locations from last N minutes
   * @returns Count of active drivers
   */
  async getActiveDriverCount(
    companyId: string,
    sinceMinutesAgo = 30
  ): Promise<number> {
    try {
      const since = new Date(Date.now() - sinceMinutesAgo * 60 * 1000);

      const result = await this.locationModel.aggregate([
        {
          $match: {
            companyId,
            timestamp: { $gte: since },
          },
        },
        {
          $group: {
            _id: '$driverId',
          },
        },
        {
          $count: 'total',
        },
      ]);

      return result[0]?.total || 0;
    } catch (error) {
      this.logger.error(`Failed to get active driver count: ${error}`);
      return 0;
    }
  }

  /**
   * Calculate trip statistics
   * @param driverId Driver ID
   * @param companyId Company ID
   * @param startTime Trip start
   * @param endTime Trip end
   * @returns Trip statistics
   */
  async calculateTripStats(
    driverId: string,
    companyId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    distance: number;
    duration: number;
    maxSpeed: number;
    avgSpeed: number;
    pointCount: number;
  }> {
    try {
      const locations = await this.getHistory(
        driverId,
        companyId,
        startTime,
        endTime
      );

      if (locations.length < 2) {
        return {
          distance: 0,
          duration: 0,
          maxSpeed: 0,
          avgSpeed: 0,
          pointCount: locations.length,
        };
      }

      let totalDistance = 0;
      let maxSpeed = 0;
      let totalSpeed = 0;
      let speedCount = 0;

      // Calculate distance between consecutive points using Haversine formula
      for (let i = 0; i < locations.length - 1; i++) {
        const current = locations[i];
        const next = locations[i + 1];

        const distance = this.haversineDistance(
          current.coordinates.coordinates[1],
          current.coordinates.coordinates[0],
          next.coordinates.coordinates[1],
          next.coordinates.coordinates[0]
        );

        totalDistance += distance;

        if (current.metadata?.speed) {
          maxSpeed = Math.max(maxSpeed, current.metadata.speed);
          totalSpeed += current.metadata.speed;
          speedCount++;
        }
      }

      const duration = endTime.getTime() - startTime.getTime(); // ms

      return {
        distance: Math.round(totalDistance * 10) / 10, // km
        duration: duration / 1000, // seconds
        maxSpeed: Math.round(maxSpeed),
        avgSpeed: speedCount > 0 ? Math.round(totalSpeed / speedCount) : 0,
        pointCount: locations.length,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate trip stats: ${error}`);
      return {
        distance: 0,
        duration: 0,
        maxSpeed: 0,
        avgSpeed: 0,
        pointCount: 0,
      };
    }
  }

  /**
   * Haversine formula for calculating distance between two points
   * @param lat1 Latitude 1
   * @param lon1 Longitude 1
   * @param lat2 Latitude 2
   * @param lon2 Longitude 2
   * @returns Distance in kilometers
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
