import { Coordinates } from '../value-objects';

/**
 * GeoLocation Entity
 * Represents a geographic point with a driver's current location
 */
export class GeoLocation {
  id?: string;
  driverId: string;
  coordinates: Coordinates;
  accuracy: number; // Meters
  heading?: number; // Degrees (0-360)
  speed?: number; // m/s
  timestamp: Date;

  constructor(props: {
    driverId: string;
    coordinates: Coordinates;
    accuracy: number;
    heading?: number;
    speed?: number;
    timestamp: Date;
    id?: string;
  }) {
    this.driverId = props.driverId;
    this.coordinates = props.coordinates;
    this.accuracy = props.accuracy;
    this.heading = props.heading;
    this.speed = props.speed;
    this.timestamp = props.timestamp;
    this.id = props.id;
  }

  isRecent(withinSeconds: number = 60): boolean {
    const now = new Date();
    const diff = (now.getTime() - this.timestamp.getTime()) / 1000;
    return diff <= withinSeconds;
  }

  toObject() {
    return {
      id: this.id,
      driverId: this.driverId,
      latitude: this.coordinates.latitude,
      longitude: this.coordinates.longitude,
      accuracy: this.accuracy,
      heading: this.heading,
      speed: this.speed,
      timestamp: this.timestamp,
    };
  }
}
