import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  IDriverAvailabilityRepository,
  DriverAvailability,
  GeoLocation,
  Coordinates,
  DriverAvailabilityStatus,
} from '../../../domain/ports';

/**
 * Redis Availability Repository
 * Manages driver availability status in Redis
 */
@Injectable()
export class RedisAvailabilityRepository
  implements IDriverAvailabilityRepository
{
  private readonly AVAILABILITY_KEY = 'going:driver_availability';
  private readonly AVAILABILITY_SET_KEY = 'going:drivers:by_status:';

  constructor(private redis: Redis) {}

  async upsert(availability: DriverAvailability): Promise<DriverAvailability> {
    const key = `${this.AVAILABILITY_KEY}:${availability.driverId}`;

    // Store availability as hash
    await this.redis.hset(key, {
      driverId: availability.driverId,
      status: availability.status,
      latitude: availability.currentLocation.coordinates.latitude.toString(),
      longitude: availability.currentLocation.coordinates.longitude.toString(),
      accuracy: availability.currentLocation.accuracy.toString(),
      availableSeats: availability.availableSeats.toString(),
      serviceTypes: JSON.stringify(availability.serviceTypes),
      lastUpdate: availability.lastUpdate.toISOString(),
    });

    // Set expiration (6 hours)
    await this.redis.expire(key, 21600);

    // Update status set
    const statusSetKey = `${this.AVAILABILITY_SET_KEY}${availability.status}`;
    await this.redis.sadd(statusSetKey, availability.driverId);

    // Update status set expiration
    await this.redis.expire(statusSetKey, 21600);

    return availability;
  }

  async findByDriverId(driverId: string): Promise<DriverAvailability | null> {
    const data = await this.redis.hgetall(
      `${this.AVAILABILITY_KEY}:${driverId}`
    );

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    const location = new GeoLocation({
      driverId,
      coordinates: new Coordinates(
        parseFloat(data.latitude),
        parseFloat(data.longitude)
      ),
      accuracy: parseInt(data.accuracy, 10),
      timestamp: new Date(data.lastUpdate),
    });

    return new DriverAvailability({
      driverId,
      status: data.status as DriverAvailabilityStatus,
      currentLocation: location,
      availableSeats: parseInt(data.availableSeats, 10),
      serviceTypes: JSON.parse(data.serviceTypes || '["standard"]'),
      lastUpdate: new Date(data.lastUpdate),
    });
  }

  async findAvailable(limit?: number): Promise<DriverAvailability[]> {
    return this.findByStatus('online', limit);
  }

  async findOnline(limit?: number): Promise<DriverAvailability[]> {
    return this.findByStatus('online', limit);
  }

  async findOffline(limit?: number): Promise<DriverAvailability[]> {
    return this.findByStatus('offline', limit);
  }

  async findByServiceType(serviceType: string): Promise<DriverAvailability[]> {
    const keys = await this.redis.keys(`${this.AVAILABILITY_KEY}:*`);
    const drivers: DriverAvailability[] = [];

    for (const key of keys) {
      const data = await this.redis.hgetall(key);
      const serviceTypes = JSON.parse(data.serviceTypes || '[]');

      if (serviceTypes.includes(serviceType)) {
        const driverId = data.driverId;
        const location = new GeoLocation({
          driverId,
          coordinates: new Coordinates(
            parseFloat(data.latitude),
            parseFloat(data.longitude)
          ),
          accuracy: parseInt(data.accuracy, 10),
          timestamp: new Date(data.lastUpdate),
        });

        drivers.push(
          new DriverAvailability({
            driverId,
            status: data.status as DriverAvailabilityStatus,
            currentLocation: location,
            availableSeats: parseInt(data.availableSeats, 10),
            serviceTypes,
            lastUpdate: new Date(data.lastUpdate),
          })
        );
      }
    }

    return drivers;
  }

  async setOffline(driverId: string): Promise<void> {
    const availability = await this.findByDriverId(driverId);
    if (availability) {
      availability.setOffline();
      await this.upsert(availability);
    }
  }

  async setOnline(driverId: string): Promise<void> {
    const availability = await this.findByDriverId(driverId);
    if (availability) {
      availability.setOnline();
      await this.upsert(availability);
    }
  }

  async setBusy(driverId: string): Promise<void> {
    const availability = await this.findByDriverId(driverId);
    if (availability) {
      availability.setBusy();
      await this.upsert(availability);
    }
  }

  async delete(driverId: string): Promise<void> {
    await this.redis.del(`${this.AVAILABILITY_KEY}:${driverId}`);

    // Remove from all status sets
    for (const status of ['online', 'busy', 'offline']) {
      await this.redis.srem(`${this.AVAILABILITY_SET_KEY}${status}`, driverId);
    }
  }

  async findAll(): Promise<DriverAvailability[]> {
    const keys = await this.redis.keys(`${this.AVAILABILITY_KEY}:*`);
    const drivers: DriverAvailability[] = [];

    for (const key of keys) {
      const data = await this.redis.hgetall(key);
      const driverId = data.driverId;

      const location = new GeoLocation({
        driverId,
        coordinates: new Coordinates(
          parseFloat(data.latitude),
          parseFloat(data.longitude)
        ),
        accuracy: parseInt(data.accuracy, 10),
        timestamp: new Date(data.lastUpdate),
      });

      drivers.push(
        new DriverAvailability({
          driverId,
          status: data.status as DriverAvailabilityStatus,
          currentLocation: location,
          availableSeats: parseInt(data.availableSeats, 10),
          serviceTypes: JSON.parse(data.serviceTypes || '["standard"]'),
          lastUpdate: new Date(data.lastUpdate),
        })
      );
    }

    return drivers;
  }

  private async findByStatus(
    status: DriverAvailabilityStatus,
    limit?: number
  ): Promise<DriverAvailability[]> {
    const setKey = `${this.AVAILABILITY_SET_KEY}${status}`;
    let driverIds = await this.redis.smembers(setKey);

    if (limit && driverIds.length > limit) {
      driverIds = driverIds.slice(0, limit);
    }

    const drivers: DriverAvailability[] = [];
    for (const driverId of driverIds) {
      const availability = await this.findByDriverId(driverId);
      if (availability && availability.status === status) {
        drivers.push(availability);
      }
    }

    return drivers;
  }
}
