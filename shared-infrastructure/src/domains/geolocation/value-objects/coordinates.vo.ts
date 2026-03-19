/**
 * Coordinates Value Object
 * Represents a geographic point with latitude and longitude
 */
export class Coordinates {
  readonly latitude: number;
  readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    if (!this.isValidLatitude(latitude)) {
      throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and 90`);
    }
    if (!this.isValidLongitude(longitude)) {
      throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and 180`);
    }

    this.latitude = latitude;
    this.longitude = longitude;
  }

  private isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  private isValidLongitude(lon: number): boolean {
    return lon >= -180 && lon <= 180;
  }

  equals(other: Coordinates): boolean {
    return this.latitude === other.latitude && this.longitude === other.longitude;
  }

  toObject() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  toArray(): [number, number] {
    return [this.longitude, this.latitude]; // GeoJSON format
  }

  toString(): string {
    return `${this.latitude},${this.longitude}`;
  }
}
