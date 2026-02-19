import { Coordinates, Distance } from '../value-objects';

/**
 * DistanceCalculatorService
 * Calculates distances between geographic coordinates using Haversine formula
 */
export class DistanceCalculatorService {
  private readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(from: Coordinates, to: Coordinates): Distance {
    const dLatRad = this.toRadians(to.latitude - from.latitude);
    const dLonRad = this.toRadians(to.longitude - from.longitude);

    const fromLatRad = this.toRadians(from.latitude);
    const toLatRad = this.toRadians(to.latitude);

    const a =
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos(fromLatRad) *
        Math.cos(toLatRad) *
        Math.sin(dLonRad / 2) *
        Math.sin(dLonRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = this.EARTH_RADIUS_KM * c;

    return new Distance(distanceKm);
  }

  /**
   * Calculate bearing between two coordinates (in degrees)
   */
  calculateBearing(from: Coordinates, to: Coordinates): number {
    const fromLatRad = this.toRadians(from.latitude);
    const fromLonRad = this.toRadians(from.longitude);
    const toLatRad = this.toRadians(to.latitude);
    const toLonRad = this.toRadians(to.longitude);

    const dLon = toLonRad - fromLonRad;

    const y = Math.sin(dLon) * Math.cos(toLatRad);
    const x =
      Math.cos(fromLatRad) * Math.sin(toLatRad) -
      Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(dLon);

    const bearing = Math.atan2(y, x);
    return (this.toDegrees(bearing) + 360) % 360;
  }

  /**
   * Get destination point given start point, distance, and bearing
   */
  getDestination(
    from: Coordinates,
    distance: Distance,
    bearing: number
  ): Coordinates {
    const fromLatRad = this.toRadians(from.latitude);
    const fromLonRad = this.toRadians(from.longitude);
    const bearingRad = this.toRadians(bearing);

    const angularDistance = distance.kilometers / this.EARTH_RADIUS_KM;

    const destLatRad = Math.asin(
      Math.sin(fromLatRad) * Math.cos(angularDistance) +
        Math.cos(fromLatRad) *
          Math.sin(angularDistance) *
          Math.cos(bearingRad)
    );

    const destLonRad =
      fromLonRad +
      Math.atan2(
        Math.sin(bearingRad) *
          Math.sin(angularDistance) *
          Math.cos(fromLatRad),
        Math.cos(angularDistance) - Math.sin(fromLatRad) * Math.sin(destLatRad)
      );

    return new Coordinates(
      this.toDegrees(destLatRad),
      this.toDegrees(destLonRad)
    );
  }

  /**
   * Check if a point is within a certain radius from another point
   */
  isWithinRadius(
    point1: Coordinates,
    point2: Coordinates,
    radius: Distance
  ): boolean {
    const distance = this.calculateDistance(point1, point2);
    return distance.isWithin(radius);
  }

  /**
   * Calculate the area of a circle with given radius (in km²)
   */
  calculateCircleArea(radius: Distance): number {
    return Math.PI * radius.kilometers * radius.kilometers;
  }

  /**
   * Estimate ETA in seconds given distance and average speed
   */
  estimateEta(distance: Distance, averageSpeedKmh: number = 40): number {
    if (averageSpeedKmh <= 0) {
      throw new Error('Average speed must be positive');
    }
    const hours = distance.kilometers / averageSpeedKmh;
    return hours * 3600; // Convert to seconds
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }
}
