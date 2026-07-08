import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    // Fail-closed: sin user válido → 401. Antes devolvía null y el request seguía
    // sin autenticar (req.user undefined), dejando pasar rutas guardadas. Auditoría #4/#15/#16.
    if (!user) {
      throw new UnauthorizedException(info?.message ?? 'Token inválido o ausente');
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
 * Money Value Object
 */
export class Money {
  readonly amount: number;
  readonly currency: string = 'USD';

  constructor(amount: number, currency: string = 'USD') {
    if (amount < 0) {
      throw new Error(`Invalid amount: ${amount}. Must be non-negative`);
    }
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency)
      throw new Error('Cannot add different currencies');
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency)
      throw new Error('Cannot subtract different currencies');
    const result = this.amount - other.amount;
    if (result < 0) throw new Error('Result cannot be negative');
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0)
      throw new Error('Multiplication factor must be non-negative');
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }
  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  toString(): string {
    const symbol = this.currency === 'USD' ? '$' : this.currency;
    return `${symbol}${this.amount.toFixed(2)}`;
  }

  toJSON() {
    return { amount: this.amount, currency: this.currency };
  }
}

/**
 * Fare Value Object
 */
export class Fare {
  readonly baseFare: Money;
  readonly perKmFare: Money;
  readonly perMinuteFare: Money;
  readonly surgeMultiplier: number;
  readonly estimatedTotal: Money;

  constructor(props: {
    baseFare: number;
    perKmFare: number;
    perMinuteFare: number;
    surgeMultiplier?: number;
    estimatedTotal: number;
  }) {
    this.baseFare = new Money(props.baseFare);
    this.perKmFare = new Money(props.perKmFare);
    this.perMinuteFare = new Money(props.perMinuteFare);
    this.surgeMultiplier = props.surgeMultiplier || 1.0;
    this.estimatedTotal = new Money(props.estimatedTotal);
  }

  static calculate(
    distanceKm: number,
    durationMinutes: number,
    surgeMultiplier: number = 1.0,
    baseFare: number = 2.5,
    perKmRate: number = 0.5,
    perMinuteRate: number = 0.1
  ): Fare {
    const distanceCost = distanceKm * perKmRate;
    const timeCost = durationMinutes * perMinuteRate;
    const subtotal = baseFare + distanceCost + timeCost;
    const total = subtotal * surgeMultiplier;
    return new Fare({
      baseFare,
      perKmFare: perKmRate,
      perMinuteFare: perMinuteRate,
      surgeMultiplier,
      estimatedTotal: total,
    });
  }

  /**
   * Tarifa FIJA — precio garantizado (del Excel) que el pasajero ya cotizó.
   * Sin componentes de distancia/tiempo: el total es el valor pactado. Se usa
   * cuando el cliente manda lockedFare, para que el viaje cobre ese precio y no
   * el estimado por distancia.
   */
  static fixed(total: number): Fare {
    return new Fare({
      baseFare: 0,
      perKmFare: 0,
      perMinuteFare: 0,
      surgeMultiplier: 1,
      estimatedTotal: total,
    });
  }

  calculateFinal(
    actualDistanceKm: number,
    actualDurationMinutes: number
  ): Money {
    const distanceCost = actualDistanceKm * this.perKmFare.amount;
    const timeCost = actualDurationMinutes * this.perMinuteFare.amount;
    const subtotal = this.baseFare.amount + distanceCost + timeCost;
    return new Money(subtotal * this.surgeMultiplier);
  }

  getPlatformCut(): Money {
    return new Money(this.estimatedTotal.amount * 0.2);
  }
  getDriverEarnings(): Money {
    return new Money(this.estimatedTotal.amount * 0.8);
  }

  toObject() {
    return {
      baseFare: this.baseFare.amount,
      perKmFare: this.perKmFare.amount,
      perMinuteFare: this.perMinuteFare.amount,
      surgeMultiplier: this.surgeMultiplier,
      estimatedTotal: this.estimatedTotal.amount,
      platformCut: this.getPlatformCut().amount,
      driverEarnings: this.getDriverEarnings().amount,
    };
  }
}

/**
 * RideStatus Enum
 */
export enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  ARRIVING = 'arriving',
  STARTED = 'started',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * CancellationReason Enum
 */
export enum CancellationReason {
  USER_CANCELLED = 'user_cancelled',
  DRIVER_CANCELLED = 'driver_cancelled',
  NO_DRIVER_ACCEPTED = 'no_driver_accepted',
  DRIVER_NOT_ARRIVED = 'driver_not_arrived',
  EMERGENCY = 'emergency',
  OTHER = 'other',
}

/**
 * Ride Entity
 */
export class Ride {
  id: string;
  userId: string;
  driverId?: string;
  pickupLocation: GeoLocation;
  dropoffLocation: Coordinates;
  fare: Fare;
  finalFare?: Money;
  status: RideStatus;
  requestedAt: Date;
  acceptedAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds?: number;
  distanceKm?: number;
  cancellationReason?: CancellationReason;
  cancellationTime?: Date;

  constructor(props: {
    id: string;
    userId: string;
    pickupLocation: GeoLocation;
    dropoffLocation: Coordinates;
    fare: Fare;
    status?: RideStatus;
    requestedAt?: Date;
    driverId?: string;
    acceptedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    finalFare?: Money;
    durationSeconds?: number;
    distanceKm?: number;
    cancellationReason?: CancellationReason;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.driverId = props.driverId;
    this.pickupLocation = props.pickupLocation;
    this.dropoffLocation = props.dropoffLocation;
    this.fare = props.fare;
    this.finalFare = props.finalFare;
    this.status = props.status || RideStatus.REQUESTED;
    this.requestedAt = props.requestedAt || new Date();
    this.acceptedAt = props.acceptedAt;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.durationSeconds = props.durationSeconds;
    this.distanceKm = props.distanceKm;
    this.cancellationReason = props.cancellationReason;
  }

  accept(driverId: string): void {
    if (this.status !== RideStatus.REQUESTED)
      throw new Error('Can only accept rides in REQUESTED status');
    this.driverId = driverId;
    this.status = RideStatus.ACCEPTED;
    this.acceptedAt = new Date();
  }

  start(currentLocation: GeoLocation): void {
    if (
      this.status !== RideStatus.ACCEPTED &&
      this.status !== RideStatus.ARRIVING
    ) {
      throw new Error('Can only start rides in ACCEPTED or ARRIVING status');
    }
    this.status = RideStatus.STARTED;
    this.startedAt = new Date();
    this.pickupLocation = currentLocation;
  }

  complete(
    endLocation: GeoLocation,
    actualDistanceKm: number,
    actualDurationSeconds: number
  ): void {
    if (this.status !== RideStatus.STARTED)
      throw new Error('Can only complete rides in STARTED status');
    this.status = RideStatus.COMPLETED;
    this.completedAt = new Date();
    this.distanceKm = actualDistanceKm;
    this.durationSeconds = actualDurationSeconds;
    this.finalFare = this.fare.calculateFinal(
      actualDistanceKm,
      actualDurationSeconds / 60
    );
  }

  cancel(reason: CancellationReason): void {
    if (this.status === RideStatus.COMPLETED)
      throw new Error('Cannot cancel completed rides');
    this.status = RideStatus.CANCELLED;
    this.cancellationReason = reason;
    this.cancellationTime = new Date();
  }

  markArriving(): void {
    if (this.status !== RideStatus.ACCEPTED)
      throw new Error('Can only mark arriving from ACCEPTED status');
    this.status = RideStatus.ARRIVING;
    this.arrivedAt = new Date();
  }

  isActive(): boolean {
    return [
      RideStatus.REQUESTED,
      RideStatus.ACCEPTED,
      RideStatus.ARRIVING,
      RideStatus.STARTED,
    ].includes(this.status);
  }

  toObject() {
    return {
      id: this.id,
      userId: this.userId,
      driverId: this.driverId,
      pickupLocation: this.pickupLocation.toObject(),
      dropoffLocation: this.dropoffLocation.toObject(),
      fare: this.fare.toObject(),
      finalFare: this.finalFare?.toJSON(),
      status: this.status,
      requestedAt: this.requestedAt,
      acceptedAt: this.acceptedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      durationSeconds: this.durationSeconds,
      distanceKm: this.distanceKm,
      cancellationReason: this.cancellationReason,
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
    return new Distance(
      this.EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    );
  }

  estimateEta(distance: Distance, averageSpeedKmh: number = 40): number {
    if (averageSpeedKmh <= 0) throw new Error('Average speed must be positive');
    return (distance.kilometers / averageSpeedKmh) * 3600;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

/**
 * GeolocationService
 */
export class GeolocationService {
  constructor(
    private geoLocationRepo: any,
    private driverAvailabilityRepo: any,
    private distanceCalculator: DistanceCalculatorService
  ) {}

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

  async findNearbyAvailableDrivers(
    latitude: number,
    longitude: number,
    radius: Distance,
    limit?: number
  ): Promise<any[]> {
    return [];
  }

  async findClosestAvailableDriver(
    latitude: number,
    longitude: number,
    searchRadius: Distance = new Distance(10)
  ): Promise<any | null> {
    return null;
  }
}

/**
 * Ride Repository Interface
 */
export interface IRideRepository {
  create(ride: any): Promise<any>;
  findById(id: string): Promise<any | null>;
  findByUserId(userId: string, limit?: number): Promise<any[]>;
  findByDriverId(driverId: string, limit?: number): Promise<any[]>;
  findActiveByDriverId(driverId: string): Promise<any[]>;
  /** Viaje activo (no terminal) del pasajero, doc crudo con lastDriver* para ETA. */
  findActiveByUserId(userId: string): Promise<any | null>;
  update(id: string, ride: any): Promise<any>;
  findRecent(limit: number): Promise<any[]>;
  findByStatus(status: string, limit?: number, excludeDriverId?: string): Promise<any[]>;
  /**
   * Viajes completados con canal abierto sin cerrar y completedAt < cutoff.
   * Filtra en la QUERY (no en memoria) para que el cierre no se pierda cuando
   * hay muchos completados (auditoría #15). Opcional en el port (mock parcial).
   */
  findChannelsToClose?(cutoff: Date, limit?: number): Promise<any[]>;
  /**
   * Búsquedas de conductor HUÉRFANAS (auditoría #9): viajes en 'requested' con un
   * lease `searchingUntil` vencido (el pod que buscaba murió). El watchdog las
   * re-despacha. Opcional en el port (mock parcial).
   */
  findStaleSearches?(now: Date, limit?: number): Promise<any[]>;
  /**
   * Compare-and-swap atómico: asigna el conductor SOLO si el viaje sigue en
   * 'requested'. Devuelve el viaje actualizado, o null si otro conductor ya lo
   * tomó (evita doble-aceptación bajo concurrencia).
   */
  acceptIfRequested(rideId: string, driverId: string): Promise<any | null>;
  /**
   * Viajes reservados (status='scheduled') cuya hora programada cae dentro
   * de la ventana de despacho (scheduledAt <= threshold) y que aún no fueron
   * disparados. Usado por ScheduledRideDispatcherCron.
   */
  findScheduledDue?(threshold: Date, limit?: number): Promise<any[]>;
  /**
   * Viajes reservados próximos que aún no recibieron un recordatorio dado.
   * `field` = 'reminder1hSentAt' | 'reminder5mSentAt'. Devuelve los rides con
   * scheduledAt en (now+fromMin, now+toMin], sin terminar y con ese flag vacío.
   */
  findUpcomingNeedingReminder?(field: string, fromMin: number, toMin: number, limit?: number): Promise<any[]>;
  /**
   * Marca que un conductor rechazó este viaje (idempotente).
   * Usado por POST /rides/:id/reject para que el viaje no aparezca de nuevo
   * en GET /rides/pending para ese conductor específico.
   */
  addRejection(rideId: string, driverId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
