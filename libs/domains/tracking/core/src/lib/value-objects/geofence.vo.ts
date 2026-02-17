import { Result, ok, err } from 'neverthrow';
import { Location } from './location.vo';

export interface GeofenceProps {
  center: Location;
  radiusKm: number;
  label?: string;
}

export class Geofence {
  readonly center: Location;
  readonly radiusKm: number;
  readonly label?: string;

  private constructor(props: GeofenceProps) {
    this.center = props.center;
    this.radiusKm = props.radiusKm;
    this.label = props.label;
  }

  public static create(props: GeofenceProps): Result<Geofence, Error> {
    if (props.radiusKm <= 0) {
      return err(new Error('Geofence radius must be greater than 0'));
    }
    if (props.radiusKm > 100) {
      return err(new Error('Geofence radius must not exceed 100 km'));
    }
    return ok(new Geofence(props));
  }

  /**
   * Checks if a given location is within this geofence using the Haversine formula.
   */
  public contains(location: Location): boolean {
    const distanceKm = Geofence.haversineKm(
      this.center.latitude,
      this.center.longitude,
      location.latitude,
      location.longitude,
    );
    return distanceKm <= this.radiusKm;
  }

  /**
   * Returns the distance in km from a location to the geofence center.
   */
  public distanceFromCenter(location: Location): number {
    return Geofence.haversineKm(
      this.center.latitude,
      this.center.longitude,
      location.latitude,
      location.longitude,
    );
  }

  /**
   * Haversine formula: calculates the great-circle distance between two points on Earth.
   */
  public static haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = Geofence.toRad(lat2 - lat1);
    const dLon = Geofence.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(Geofence.toRad(lat1)) *
        Math.cos(Geofence.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  public toPrimitives(): Record<string, unknown> {
    return {
      center: this.center.toPrimitives(),
      radiusKm: this.radiusKm,
      label: this.label,
    };
  }

  public static fromPrimitives(props: Record<string, any>): Geofence {
    return new Geofence({
      center: Location.fromPrimitives(props.center),
      radiusKm: props.radiusKm,
      label: props.label,
    });
  }
}
