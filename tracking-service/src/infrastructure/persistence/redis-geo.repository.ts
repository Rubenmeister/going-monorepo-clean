import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  IGeoLocationRepository,
  GeoLocation,
  Coordinates,
  Distance,
} from '../../domain/ports';

/**
 * Redis Geo Repository
 * Uses Redis GEO commands for efficient spatial queries
 */
@Injectable()
export class RedisGeoRepository implements IGeoLocationRepository {
  private readonly GEO_KEY = 'going:drivers:locations';
  private readonly LOCATION_HASH_KEY = 'going:driver_locations';

  constructor(private redis: Redis) {}

  async saveLocation(location: GeoLocation): Promise<void> {
    // Store in Redis GEO index
    await this.redis.geoadd(
      this.GEO_KEY,
      location.coordinates.longitude,
      location.coordinates.latitude,
      location.driverId
    );

    // Store full location data as hash
    await this.redis.hset(`${this.LOCATION_HASH_KEY}:${location.driverId}`, {
      latitude: location.coordinates.latitude.toString(),
      longitude: location.coordinates.longitude.toString(),
      accuracy: location.accuracy.toString(),
      heading: (location.heading || 0).toString(),
      speed: (location.speed || 0).toString(),
      timestamp: location.timestamp.toISOString(),
    });

    // Set expiration (6 hours)
    await this.redis.expire(
      `${this.LOCATION_HASH_KEY}:${location.driverId}`,
      21600
    );
  }

  async getDriverLocation(driverId: string): Promise<GeoLocation | null> {
    const data = await this.redis.hgetall(
      `${this.LOCATION_HASH_KEY}:${driverId}`
    );

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return new GeoLocation({
      driverId,
      coordinates: new Coordinates(
        parseFloat(data.latitude),
        parseFloat(data.longitude)
      ),
      accuracy: parseInt(data.accuracy, 10),
      heading: parseInt(data.heading, 10),
      speed: parseFloat(data.speed),
      timestamp: new Date(data.timestamp),
    });
  }

  async findDriversNearby(
    latitude: number,
    longitude: number,
    radius: Distance,
    limit?: number
  ): Promise<GeoLocation[]> {
    const results = await this.redis.georadius(
      this.GEO_KEY,
      longitude,
      latitude,
      radius.kilometers,
      'km',
      'WITHDIST',
      'ASC',
      'COUNT',
      limit || 100
    );

    const locations: GeoLocation[] = [];

    for (let i = 0; i < results.length; i += 2) {
      const driverId = results[i] as string;
      const location = await this.getDriverLocation(driverId);
      if (location) {
        locations.push(location);
      }
    }

    return locations;
  }

  async findDriversNearbyMultiple(
    searchLocations: Array<{ latitude: number; longitude: number }>,
    radius: Distance
  ): Promise<Map<string, GeoLocation[]>> {
    const resultMap = new Map<string, GeoLocation[]>();

    for (let i = 0; i < searchLocations.length; i++) {
      const { latitude, longitude } = searchLocations[i];
      const key = `${latitude},${longitude}`;
      const results = await this.findDriversNearby(
        latitude,
        longitude,
        radius,
        100
      );
      resultMap.set(key, results);
    }

    return resultMap;
  }

  async getDistance(
    driverId1: string,
    driverId2: string
  ): Promise<Distance | null> {
    const location1 = await this.getDriverLocation(driverId1);
    const location2 = await this.getDriverLocation(driverId2);

    if (!location1 || !location2) {
      return null;
    }

    const result = await this.redis.geodist(
      this.GEO_KEY,
      driverId1,
      driverId2,
      'km'
    );

    if (result === null) {
      return null;
    }

    return new Distance(parseFloat(result));
  }

  async deleteLocation(driverId: string): Promise<void> {
    await this.redis.zrem(this.GEO_KEY, driverId);
    await this.redis.del(`${this.LOCATION_HASH_KEY}:${driverId}`);
  }

  async getAllActiveDrivers(): Promise<GeoLocation[]> {
    const keys = await this.redis.zrange(this.GEO_KEY, 0, -1);
    const locations: GeoLocation[] = [];

    for (const driverId of keys) {
      const location = await this.getDriverLocation(driverId);
      if (location) {
        locations.push(location);
      }
    }

    return locations;
  }
}
