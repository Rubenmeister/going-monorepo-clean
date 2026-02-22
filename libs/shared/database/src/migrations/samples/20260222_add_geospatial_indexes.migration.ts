/**
 * Sample Migration: Add Geospatial Indexes
 * Adds geospatial indexes for location-based queries
 * Critical for ride-matching and driver location searches
 */

import { IMigration } from '../migration.interface';
import { Connection } from 'mongoose';

export class AddGeospatialIndexesMigration implements IMigration {
  id = '20260222_120000_add_geospatial_indexes';
  version = 1;
  description = 'Add geospatial indexes for location queries';

  constructor(private connection: Connection) {}

  async up(): Promise<void> {
    const db = this.connection.getClient().db();

    // Add 2dsphere indexes for geospatial queries
    await db
      .collection('users')
      .createIndex(
        { 'currentLocation.coordinates': '2dsphere' },
        { name: 'idx_user_location_2dsphere' }
      );

    await db
      .collection('rides')
      .createIndex(
        { 'pickupLocation.coordinates': '2dsphere' },
        { name: 'idx_ride_pickup_location_2dsphere' }
      );

    await db
      .collection('rides')
      .createIndex(
        { 'dropoffLocation.coordinates': '2dsphere' },
        { name: 'idx_ride_dropoff_location_2dsphere' }
      );

    // Add compound indexes for common queries
    await db
      .collection('rides')
      .createIndex(
        { status: 1, 'pickupLocation.coordinates': '2dsphere' },
        { name: 'idx_ride_status_location' }
      );

    await db
      .collection('users')
      .createIndex(
        { role: 1, 'currentLocation.coordinates': '2dsphere' },
        { name: 'idx_driver_role_location' }
      );
  }

  async down(): Promise<void> {
    const db = this.connection.getClient().db();

    // Drop indexes
    try {
      await db.collection('users').dropIndex('idx_user_location_2dsphere');
      await db
        .collection('rides')
        .dropIndex('idx_ride_pickup_location_2dsphere');
      await db
        .collection('rides')
        .dropIndex('idx_ride_dropoff_location_2dsphere');
      await db.collection('rides').dropIndex('idx_ride_status_location');
      await db.collection('users').dropIndex('idx_driver_role_location');
    } catch (error) {
      // Index might not exist, continue
    }
  }
}
