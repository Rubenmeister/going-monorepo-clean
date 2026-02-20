import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * JWT Auth Guard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any) {
    if (err) {
      throw err;
    }
    if (!user) {
      return null;
    }
    return user;
  }
}

/**
 * @CurrentUser decorator
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    if (data) return user[data];
    return user;
  }
);

/**
 * Coordinates Value Object
 * Represents a geographic point with latitude and longitude
 */
export class Coordinates {
  readonly latitude: number;
  readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    if (latitude < -90 || latitude > 90) {
      throw new Error(
        `Invalid latitude: ${latitude}. Must be between -90 and 90`
      );
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error(
        `Invalid longitude: ${longitude}. Must be between -180 and 180`
      );
    }
    this.latitude = latitude;
    this.longitude = longitude;
  }

  equals(other: Coordinates): boolean {
    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    );
  }

  toObject() {
    return { latitude: this.latitude, longitude: this.longitude };
  }

  toArray(): [number, number] {
    return [this.longitude, this.latitude];
  }

  toString(): string {
    return `${this.latitude},${this.longitude}`;
  }
}

/**
 * Distance Value Object
 * Represents a geographic distance in kilometers
 */
export class Distance {
  readonly kilometers: number;

  constructor(kilometers: number) {
    if (kilometers < 0) {
      throw new Error(`Invalid distance: ${kilometers}. Must be non-negative`);
    }
    this.kilometers = kilometers;
  }

  get meters(): number {
    return this.kilometers * 1000;
  }

  get miles(): number {
    return this.kilometers * 0.621371;
  }

  equals(other: Distance): boolean {
    return Math.abs(this.kilometers - other.kilometers) < 0.0001;
  }

  isWithin(other: Distance): boolean {
    return this.kilometers <= other.kilometers;
  }

  isGreaterThan(other: Distance): boolean {
    return this.kilometers > other.kilometers;
  }

  isLessThan(other: Distance): boolean {
    return this.kilometers < other.kilometers;
  }

  toString(): string {
    return `${this.kilometers.toFixed(2)} km`;
  }

  toJSON() {
    return {
      kilometers: this.kilometers,
      meters: this.meters,
      miles: this.miles,
    };
  }
}

/**
 * GeoLocation Entity
 */
export class GeoLocation {
  id?: string;
  driverId: string;
  coordinates: Coordinates;
  accuracy: number;
  heading?: number;
  speed?: number;
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

/**
 * DriverAvailability Entity
 */
export type DriverAvailabilityStatus = 'online' | 'busy' | 'offline';

export class DriverAvailability {
  driverId: string;
  status: DriverAvailabilityStatus;
  currentLocation: GeoLocation;
  availableSeats: number;
  serviceTypes: string[];
  lastUpdate: Date;

  constructor(props: {
    driverId: string;
    status: DriverAvailabilityStatus;
    currentLocation: GeoLocation;
    availableSeats: number;
    serviceTypes?: string[];
    lastUpdate?: Date;
  }) {
    this.driverId = props.driverId;
    this.status = props.status;
    this.currentLocation = props.currentLocation;
    this.availableSeats = props.availableSeats;
    this.serviceTypes = props.serviceTypes || ['standard'];
    this.lastUpdate = props.lastUpdate || new Date();
  }

  isOnline(): boolean {
    return this.status === 'online';
  }
  isBusy(): boolean {
    return this.status === 'busy';
  }
  isOffline(): boolean {
    return this.status === 'offline';
  }
  isAvailable(): boolean {
    return this.isOnline() && this.availableSeats > 0;
  }

  setOffline(): void {
    this.status = 'offline';
    this.lastUpdate = new Date();
  }
  setOnline(): void {
    this.status = 'online';
    this.lastUpdate = new Date();
  }
  setBusy(): void {
    this.status = 'busy';
    this.lastUpdate = new Date();
  }

  updateLocation(location: GeoLocation): void {
    this.currentLocation = location;
    this.lastUpdate = new Date();
  }

  toObject() {
    return {
      driverId: this.driverId,
      status: this.status,
      currentLocation: this.currentLocation.toObject(),
      availableSeats: this.availableSeats,
      serviceTypes: this.serviceTypes,
      lastUpdate: this.lastUpdate,
    };
  }
}

/**
 * TrackingSession Entity
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
      throw new Error(
        'Cannot add location to completed or cancelled tracking session'
      );
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
    return (endTime.getTime() - this.createdAt.getTime()) / 1000;
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
    const R = 6371;
    const dLat =
      ((loc2.coordinates.latitude - loc1.coordinates.latitude) * Math.PI) / 180;
    const dLon =
      ((loc2.coordinates.longitude - loc1.coordinates.longitude) * Math.PI) /
      180;
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

/**
 * DistanceCalculatorService
 */
export class DistanceCalculatorService {
  private readonly EARTH_RADIUS_KM = 6371;

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
    return new Distance(this.EARTH_RADIUS_KM * c);
  }

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
    return (this.toDegrees(Math.atan2(y, x)) + 360) % 360;
  }

  isWithinRadius(
    point1: Coordinates,
    point2: Coordinates,
    radius: Distance
  ): boolean {
    return this.calculateDistance(point1, point2).isWithin(radius);
  }

  estimateEta(distance: Distance, averageSpeedKmh: number = 40): number {
    if (averageSpeedKmh <= 0) throw new Error('Average speed must be positive');
    return (distance.kilometers / averageSpeedKmh) * 3600;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }
}

/**
 * GeolocationService
 */
export class GeolocationService {
  constructor(
    private geoLocationRepo: IGeoLocationRepository,
    private driverAvailabilityRepo: IDriverAvailabilityRepository,
    private distanceCalculator: DistanceCalculatorService
  ) {}

  async findNearbyAvailableDrivers(
    latitude: number,
    longitude: number,
    radius: Distance,
    limit?: number
  ): Promise<DriverAvailability[]> {
    const nearbyLocations = await this.geoLocationRepo.findDriversNearby(
      latitude,
      longitude,
      radius,
      limit
    );
    const drivers: DriverAvailability[] = [];
    for (const location of nearbyLocations) {
      const availability = await this.driverAvailabilityRepo.findByDriverId(
        location.driverId
      );
      if (availability && availability.isAvailable()) {
        drivers.push(availability);
      }
    }
    return drivers.sort((a, b) => {
      const distA = this.distanceCalculator.calculateDistance(
        new Coordinates(latitude, longitude),
        a.currentLocation.coordinates
      );
      const distB = this.distanceCalculator.calculateDistance(
        new Coordinates(latitude, longitude),
        b.currentLocation.coordinates
      );
      return distA.kilometers - distB.kilometers;
    });
  }

  estimateEta(
    driverLocation: GeoLocation,
    pickupLocation: Coordinates,
    averageSpeedKmh: number = 40
  ): number {
    const distance = this.distanceCalculator.calculateDistance(
      driverLocation.coordinates,
      pickupLocation
    );
    return this.distanceCalculator.estimateEta(distance, averageSpeedKmh);
  }

  calculateRouteDistance(locations: GeoLocation[]): Distance {
    if (locations.length < 2) return new Distance(0);
    let totalDistance = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      const dist = this.distanceCalculator.calculateDistance(
        locations[i].coordinates,
        locations[i + 1].coordinates
      );
      totalDistance += dist.kilometers;
    }
    return new Distance(totalDistance);
  }

  async findClosestAvailableDriver(
    latitude: number,
    longitude: number,
    searchRadius: Distance = new Distance(10)
  ): Promise<DriverAvailability | null> {
    const nearbyDrivers = await this.findNearbyAvailableDrivers(
      latitude,
      longitude,
      searchRadius,
      1
    );
    return nearbyDrivers.length > 0 ? nearbyDrivers[0] : null;
  }

  async getDistanceBetweenDrivers(
    driverId1: string,
    driverId2: string
  ): Promise<Distance | null> {
    return this.geoLocationRepo.getDistance(driverId1, driverId2);
  }

  async isDriverInServiceArea(
    driverId: string,
    serviceCenter: Coordinates,
    serviceRadius: Distance
  ): Promise<boolean> {
    const driverLocation = await this.geoLocationRepo.getDriverLocation(
      driverId
    );
    if (!driverLocation) return false;
    return this.distanceCalculator.isWithinRadius(
      driverLocation.coordinates,
      serviceCenter,
      serviceRadius
    );
  }

  calculateBearing(from: Coordinates, to: Coordinates): number {
    return this.distanceCalculator.calculateBearing(from, to);
  }
}

/**
 * GeoLocation Repository Interface
 */
export interface IGeoLocationRepository {
  saveLocation(location: GeoLocation): Promise<void>;
  getDriverLocation(driverId: string): Promise<GeoLocation | null>;
  findDriversNearby(
    latitude: number,
    longitude: number,
    radius: Distance,
    limit?: number
  ): Promise<GeoLocation[]>;
  findDriversNearbyMultiple(
    locations: Array<{ latitude: number; longitude: number }>,
    radius: Distance
  ): Promise<Map<string, GeoLocation[]>>;
  getDistance(driverId1: string, driverId2: string): Promise<Distance | null>;
  deleteLocation(driverId: string): Promise<void>;
  getAllActiveDrivers(): Promise<GeoLocation[]>;
}

/**
 * DriverAvailability Repository Interface
 */
export interface IDriverAvailabilityRepository {
  upsert(availability: DriverAvailability): Promise<DriverAvailability>;
  findByDriverId(driverId: string): Promise<DriverAvailability | null>;
  findAvailable(limit?: number): Promise<DriverAvailability[]>;
  findOnline(limit?: number): Promise<DriverAvailability[]>;
  findOffline(limit?: number): Promise<DriverAvailability[]>;
  findByServiceType(serviceType: string): Promise<DriverAvailability[]>;
  setOffline(driverId: string): Promise<void>;
  setOnline(driverId: string): Promise<void>;
  setBusy(driverId: string): Promise<void>;
  delete(driverId: string): Promise<void>;
  findAll(): Promise<DriverAvailability[]>;
}

/**
 * TrackingSession Repository Interface
 */
export interface ITrackingSessionRepository {
  create(session: TrackingSession): Promise<TrackingSession>;
  findById(id: string): Promise<TrackingSession | null>;
  findByTripId(tripId: string): Promise<TrackingSession | null>;
  findActiveByDriverId(driverId: string): Promise<TrackingSession[]>;
  findByUserId(userId: string, limit?: number): Promise<TrackingSession[]>;
  update(
    id: string,
    session: Partial<TrackingSession>
  ): Promise<TrackingSession>;
  complete(id: string, endLocation: any): Promise<TrackingSession>;
  delete(id: string): Promise<void>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    driverId?: string
  ): Promise<TrackingSession[]>;
}

/**
 * ITrackingRepository - Symbol for DI (Redis-based live tracking)
 */
export const ITrackingRepository = Symbol('ITrackingRepository');

/**
 * ITrackingGateway - Symbol for DI (WebSocket gateway)
 */
export const ITrackingGateway = Symbol('ITrackingGateway');
