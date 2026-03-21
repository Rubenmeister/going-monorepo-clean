/**
 * Location Privacy & Geofencing Service
 * GDPR-compliant location data management with geofencing capabilities
 * Handles location data retention, user consent, revocation, and secure deletion
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { v4 as uuid } from 'uuid';

export interface LocationConsent {
  userId: string;
  type: 'REAL_TIME' | 'TRIP_TRACKING' | 'ANALYTICS';
  granted: boolean;
  grantedAt: Date;
  expiresAt: Date;
  purposes: string[];
}

export interface Geofence {
  id: string;
  name: string;
  center: { latitude: number; longitude: number };
  radius: number; // meters
  createdAt: Date;
}

export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  tripId?: string;
  isEncrypted: boolean;
}

@Injectable()
export class LocationPrivacyService {
  private readonly logger = new Logger(LocationPrivacyService.name);
  private readonly LOCATION_RETENTION_DAYS = 90; // GDPR compliance
  private readonly CONSENT_EXPIRY_DAYS = 365;
  private readonly GEOFENCE_COLLECTION = 'geofences';
  private readonly CONSENT_COLLECTION = 'location_consents';
  private readonly LOCATION_ARCHIVE_COLLECTION = 'location_archive';

  constructor(@InjectConnection() private connection: Connection) {
    this.setupIndexes();
  }

  /**
   * Request location tracking consent
   * GDPR Article 7: Lawful basis for processing
   */
  async requestConsent(
    userId: string,
    consentType: 'REAL_TIME' | 'TRIP_TRACKING' | 'ANALYTICS',
    purposes: string[]
  ): Promise<LocationConsent> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection(this.CONSENT_COLLECTION);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.CONSENT_EXPIRY_DAYS);

      const consent: LocationConsent = {
        userId,
        type: consentType,
        granted: false,
        grantedAt: new Date(),
        expiresAt,
        purposes,
      };

      await collection.insertOne(consent);

      this.logger.log(`Consent requested for user ${userId}: ${consentType}`);

      return consent;
    } catch (error) {
      this.logger.error(
        `Failed to request consent: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Grant location tracking consent
   */
  async grantConsent(
    userId: string,
    consentType: 'REAL_TIME' | 'TRIP_TRACKING' | 'ANALYTICS'
  ): Promise<void> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection(this.CONSENT_COLLECTION);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.CONSENT_EXPIRY_DAYS);

      await collection.updateOne(
        { userId, type: consentType },
        {
          $set: {
            granted: true,
            grantedAt: new Date(),
            expiresAt,
          },
        },
        { upsert: true }
      );

      this.logger.log(`Consent granted for user ${userId}: ${consentType}`);
    } catch (error) {
      this.logger.error(
        `Failed to grant consent: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Revoke location tracking consent
   * GDPR Article 7: Right to withdraw consent
   */
  async revokeConsent(
    userId: string,
    consentType?: 'REAL_TIME' | 'TRIP_TRACKING' | 'ANALYTICS'
  ): Promise<void> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection(this.CONSENT_COLLECTION);

      const query: Record<string, any> = { userId };
      if (consentType) query.type = consentType;

      await collection.updateMany(query, {
        $set: {
          granted: false,
          revokedAt: new Date(),
        },
      });

      this.logger.log(
        `Consent revoked for user ${userId}${
          consentType ? `: ${consentType}` : ''
        }`
      );
    } catch (error) {
      this.logger.error(
        `Failed to revoke consent: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Check if user has active consent for location tracking
   */
  async hasActiveConsent(
    userId: string,
    consentType: 'REAL_TIME' | 'TRIP_TRACKING' | 'ANALYTICS'
  ): Promise<boolean> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection(this.CONSENT_COLLECTION);

      const consent = await collection.findOne({
        userId,
        type: consentType,
        granted: true,
        expiresAt: { $gt: new Date() },
      });

      return !!consent;
    } catch (error) {
      this.logger.error(
        `Failed to check consent: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  /**
   * Create geofence for location-based alerts
   */
  async createGeofence(
    name: string,
    center: { latitude: number; longitude: number },
    radius: number
  ): Promise<Geofence> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection(this.GEOFENCE_COLLECTION);

      const geofence: Geofence = {
        id: uuid(),
        name,
        center,
        radius,
        createdAt: new Date(),
      };

      // Create 2dsphere index for geospatial queries
      await collection.createIndex({
        'center.coordinates': '2dsphere',
      });

      await collection.insertOne({
        ...geofence,
        'center.coordinates': [center.longitude, center.latitude],
      });

      this.logger.log(`Geofence created: ${name}`);

      return geofence;
    } catch (error) {
      this.logger.error(
        `Failed to create geofence: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Check if location is within geofence
   */
  isWithinGeofence(
    location: { latitude: number; longitude: number },
    geofence: Geofence
  ): boolean {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(geofence.center.latitude - location.latitude);
    const dLon = this.toRad(geofence.center.longitude - location.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(location.latitude)) *
        Math.cos(this.toRad(geofence.center.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= geofence.radius;
  }

  /**
   * Archive location data (GDPR: Data minimization principle)
   * Move old data to archive after retention period
   */
  async archiveOldLocationData(): Promise<number> {
    try {
      const db = this.connection.getClient().db();
      const locationsCollection = db.collection('locations');
      const archiveCollection = db.collection(this.LOCATION_ARCHIVE_COLLECTION);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.LOCATION_RETENTION_DAYS);

      // Find old locations
      const oldLocations = await locationsCollection
        .find({ timestamp: { $lt: cutoffDate } })
        .toArray();

      if (oldLocations.length > 0) {
        // Archive them
        await archiveCollection.insertMany(oldLocations);

        // Delete from active collection
        await locationsCollection.deleteMany({
          timestamp: { $lt: cutoffDate },
        });

        this.logger.log(`Archived ${oldLocations.length} location records`);
      }

      return oldLocations.length;
    } catch (error) {
      this.logger.error(
        `Failed to archive location data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Delete all user location data
   * GDPR Article 17: Right to be forgotten
   */
  async deleteUserLocationData(userId: string): Promise<void> {
    try {
      const db = this.connection.getClient().db();

      // Delete active locations
      await db.collection('locations').deleteMany({ userId });

      // Delete archived locations
      await db
        .collection(this.LOCATION_ARCHIVE_COLLECTION)
        .deleteMany({ userId });

      // Delete consent records
      await db.collection(this.CONSENT_COLLECTION).deleteMany({ userId });

      this.logger.log(
        `All location data deleted for user ${userId} (Right to be forgotten)`
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete user location data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Get user location data summary (GDPR: Right to data portability)
   */
  async getUserLocationData(userId: string): Promise<any> {
    try {
      const db = this.connection.getClient().db();

      const locations = await db
        .collection('locations')
        .find({ userId })
        .limit(1000)
        .toArray();

      const consents = await db
        .collection(this.CONSENT_COLLECTION)
        .find({ userId })
        .toArray();

      return {
        userId,
        locationCount: locations.length,
        locations,
        consents,
        exportDate: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user location data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private async setupIndexes(): Promise<void> {
    try {
      const db = this.connection.getClient().db();

      // Create indexes for efficient querying
      await db.collection(this.CONSENT_COLLECTION).createIndex({ userId: 1 });
      await db
        .collection(this.CONSENT_COLLECTION)
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await db
        .collection(this.LOCATION_ARCHIVE_COLLECTION)
        .createIndex({ userId: 1, timestamp: -1 });
    } catch (error) {
      this.logger.warn('Failed to setup indexes for location privacy');
    }
  }
}
