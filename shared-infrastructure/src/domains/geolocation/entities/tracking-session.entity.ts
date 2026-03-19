import { GeoLocation } from './geo-location.entity';

/**
 * TrackingSession Entity
 * Represents an active tracking session for a trip
 */
export type TrackingSessionStatus = 'active' | 'completed' | 'cancelled';

export class TrackingSession {
  id: string;
  tripId: string;
  driverId: string;
  userId: string;
  startLocation: GeoLocation;
  endLocation?: GeoLocation;
  route: GeoLocation[] = [];
  status: TrackingSessionStatus;
  createdAt: Date;
  completedAt?: Date;

  constructor(props: {
    id: string;
    tripId: string;
    driverId: string;
    userId: string;
    startLocation: GeoLocation;
    endLocation?: GeoLocation;
    route?: GeoLocation[];
    status?: TrackingSessionStatus;
    createdAt?: Date;
    completedAt?: Date;
  }) {
    this.id = props.id;
    this.tripId = props.tripId;
    this.driverId = props.driverId;
    this.userId = props.userId;
    this.startLocation = props.startLocation;
    this.endLocation = props.endLocation;
    this.route = props.route || [];
    this.status = props.status || 'active';
    this.createdAt = props.createdAt || new Date();
    this.completedAt = props.completedAt;
  }

  addLocationPoint(location: GeoLocation): void {
    if (this.status !== 'active') {
      throw new Error('Cannot add location to completed or cancelled tracking session');
    }
    this.route.push(location);
  }

  complete(endLocation: GeoLocation): void {
    if (this.status !== 'active') {
      throw new Error('Can only complete active tracking sessions');
    }
    this.status = 'completed';
    this.endLocation = endLocation;
    this.completedAt = new Date();
  }

  cancel(): void {
    if (this.status === 'completed') {
      throw new Error('Cannot cancel completed tracking session');
    }
    this.status = 'cancelled';
    this.completedAt = new Date();
  }

  getDuration(): number {
    const endTime = this.completedAt || new Date();
    return (endTime.getTime() - this.createdAt.getTime()) / 1000; // seconds
  }

  getDistance(): number {
    if (this.route.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < this.route.length - 1; i++) {
      const point1 = this.route[i];
      const point2 = this.route[i + 1];
      totalDistance += this.calculateDistance(point1, point2);
    }
    return totalDistance;
  }

  private calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    // Haversine formula - simplified (in km)
    const R = 6371; // Earth's radius in km
    const dLat =
      ((loc2.coordinates.latitude - loc1.coordinates.latitude) * Math.PI) / 180;
    const dLon =
      ((loc2.coordinates.longitude - loc1.coordinates.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.coordinates.latitude * Math.PI) / 180) *
        Math.cos((loc2.coordinates.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toObject() {
    return {
      id: this.id,
      tripId: this.tripId,
      driverId: this.driverId,
      userId: this.userId,
      startLocation: this.startLocation.toObject(),
      endLocation: this.endLocation?.toObject(),
      routeLength: this.route.length,
      status: this.status,
      distance: this.getDistance(),
      duration: this.getDuration(),
      createdAt: this.createdAt,
      completedAt: this.completedAt,
    };
  }
}
