import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID, Money, Location } from '@going-monorepo-clean/shared-domain';
import { VehicleType, VehicleTypeEnum } from '../value-objects/vehicle-type.vo';
import { SeatPosition, FRONT_SEAT_PREMIUM_CENTS } from '../value-objects/seat.vo';

export type RideType = 'PRIVATE' | 'SHARED';

export type PaymentStatus = 'none' | 'pending' | 'processing' | 'paid' | 'failed';

export type RideRequestStatus =
  | 'pending'
  | 'searching'
  | 'assigned'
  | 'driver_en_route'
  | 'passenger_picked_up'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_driver_found';

export interface RideRequestProps {
  id: UUID;
  passengerId: UUID;
  origin: Location;
  destination: Location;
  vehicleTypePreference: VehicleType;
  rideType: RideType;
  seatPreference: SeatPosition;
  passengersCount: number;
  basePrice: Money;
  seatPremium: Money;
  totalPrice: Money;
  assignedVehicleId?: UUID;
  assignedDriverId?: UUID;
  assignedSeatNumber?: number;
  status: RideRequestStatus;
  paymentStatus: PaymentStatus;
  paymentIntentClientSecret?: string;
  transactionId?: UUID;
  requestedAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  priority: number; // Lower = higher priority (first-come-first-served)
}

export class RideRequest {
  readonly id: UUID;
  readonly passengerId: UUID;
  readonly origin: Location;
  readonly destination: Location;
  readonly vehicleTypePreference: VehicleType;
  readonly rideType: RideType;
  readonly seatPreference: SeatPosition;
  readonly passengersCount: number;
  readonly basePrice: Money;
  readonly seatPremium: Money;
  readonly totalPrice: Money;
  readonly assignedVehicleId?: UUID;
  readonly assignedDriverId?: UUID;
  readonly assignedSeatNumber?: number;
  readonly status: RideRequestStatus;
  readonly paymentStatus: PaymentStatus;
  readonly paymentIntentClientSecret?: string;
  readonly transactionId?: UUID;
  readonly requestedAt: Date;
  readonly assignedAt?: Date;
  readonly completedAt?: Date;
  readonly cancelledAt?: Date;
  readonly priority: number;

  private constructor(props: RideRequestProps) {
    this.id = props.id;
    this.passengerId = props.passengerId;
    this.origin = props.origin;
    this.destination = props.destination;
    this.vehicleTypePreference = props.vehicleTypePreference;
    this.rideType = props.rideType;
    this.seatPreference = props.seatPreference;
    this.passengersCount = props.passengersCount;
    this.basePrice = props.basePrice;
    this.seatPremium = props.seatPremium;
    this.totalPrice = props.totalPrice;
    this.assignedVehicleId = props.assignedVehicleId;
    this.assignedDriverId = props.assignedDriverId;
    this.assignedSeatNumber = props.assignedSeatNumber;
    this.status = props.status;
    this.paymentStatus = props.paymentStatus;
    this.paymentIntentClientSecret = props.paymentIntentClientSecret;
    this.transactionId = props.transactionId;
    this.requestedAt = props.requestedAt;
    this.assignedAt = props.assignedAt;
    this.completedAt = props.completedAt;
    this.cancelledAt = props.cancelledAt;
    this.priority = props.priority;
  }

  public static create(props: {
    passengerId: UUID;
    origin: Location;
    destination: Location;
    vehicleTypePreference: VehicleType;
    rideType: RideType;
    seatPreference: SeatPosition;
    passengersCount: number;
    basePrice: Money;
    priority: number;
  }): Result<RideRequest, Error> {
    if (!props.basePrice.isPositive()) {
      return err(new Error('Base price must be positive'));
    }
    if (props.passengersCount < 1) {
      return err(new Error('At least 1 passenger required'));
    }

    const premiumCents = props.seatPreference === SeatPosition.FRONT
      ? FRONT_SEAT_PREMIUM_CENTS * props.passengersCount
      : 0;
    const seatPremiumResult = Money.create(premiumCents, 'USD');
    if (seatPremiumResult.isErr()) return err(seatPremiumResult.error);

    const totalCents = props.basePrice.amount + premiumCents;
    const totalPriceResult = Money.create(totalCents, 'USD');
    if (totalPriceResult.isErr()) return err(totalPriceResult.error);

    return ok(new RideRequest({
      id: uuidv4(),
      passengerId: props.passengerId,
      origin: props.origin,
      destination: props.destination,
      vehicleTypePreference: props.vehicleTypePreference,
      rideType: props.rideType,
      seatPreference: props.seatPreference,
      passengersCount: props.passengersCount,
      basePrice: props.basePrice,
      seatPremium: seatPremiumResult.value,
      totalPrice: totalPriceResult.value,
      status: 'pending',
      paymentStatus: 'none',
      requestedAt: new Date(),
      priority: props.priority,
    }));
  }

  // --- Payment lifecycle ---

  public markPaymentPending(clientSecret: string): RideRequest {
    return new RideRequest({
      ...this,
      paymentStatus: 'pending',
      paymentIntentClientSecret: clientSecret,
    });
  }

  public markPaymentProcessing(): RideRequest {
    return new RideRequest({ ...this, paymentStatus: 'processing' });
  }

  public markPaymentPaid(transactionId: UUID): RideRequest {
    return new RideRequest({
      ...this,
      paymentStatus: 'paid',
      transactionId,
    });
  }

  public markPaymentFailed(): RideRequest {
    return new RideRequest({ ...this, paymentStatus: 'failed' });
  }

  // --- Ride lifecycle ---

  public markSearching(): RideRequest {
    return new RideRequest({ ...this, status: 'searching' });
  }

  public assignVehicle(vehicleId: UUID, driverId: UUID, seatNumber: number): Result<RideRequest, Error> {
    if (this.status !== 'pending' && this.status !== 'searching') {
      return err(new Error('Ride request is not in an assignable state'));
    }
    return ok(new RideRequest({
      ...this,
      assignedVehicleId: vehicleId,
      assignedDriverId: driverId,
      assignedSeatNumber: seatNumber,
      status: 'assigned',
      assignedAt: new Date(),
    }));
  }

  public driverEnRoute(): Result<RideRequest, Error> {
    if (this.status !== 'assigned') {
      return err(new Error('Must be assigned to mark driver en route'));
    }
    return ok(new RideRequest({ ...this, status: 'driver_en_route' }));
  }

  public pickUpPassenger(): Result<RideRequest, Error> {
    if (this.status !== 'driver_en_route') {
      return err(new Error('Driver must be en route to pick up'));
    }
    return ok(new RideRequest({ ...this, status: 'passenger_picked_up' }));
  }

  public startRide(): Result<RideRequest, Error> {
    if (this.status !== 'passenger_picked_up') {
      return err(new Error('Passenger must be picked up to start'));
    }
    return ok(new RideRequest({ ...this, status: 'in_progress' }));
  }

  public complete(): Result<RideRequest, Error> {
    if (this.status !== 'in_progress') {
      return err(new Error('Ride must be in progress to complete'));
    }
    return ok(new RideRequest({
      ...this,
      status: 'completed',
      completedAt: new Date(),
    }));
  }

  public cancel(): Result<RideRequest, Error> {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return err(new Error('Cannot cancel a completed/cancelled ride'));
    }
    return ok(new RideRequest({
      ...this,
      status: 'cancelled',
      cancelledAt: new Date(),
    }));
  }

  public noDriverFound(): RideRequest {
    return new RideRequest({ ...this, status: 'no_driver_found' });
  }

  public isPrivate(): boolean {
    return this.rideType === 'PRIVATE';
  }

  public isShared(): boolean {
    return this.rideType === 'SHARED';
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      passengerId: this.passengerId,
      origin: this.origin.toPrimitives(),
      destination: this.destination.toPrimitives(),
      vehicleTypePreference: this.vehicleTypePreference.toPrimitives(),
      rideType: this.rideType,
      seatPreference: this.seatPreference,
      passengersCount: this.passengersCount,
      basePrice: this.basePrice.toPrimitives(),
      seatPremium: this.seatPremium.toPrimitives(),
      totalPrice: this.totalPrice.toPrimitives(),
      assignedVehicleId: this.assignedVehicleId,
      assignedDriverId: this.assignedDriverId,
      assignedSeatNumber: this.assignedSeatNumber,
      status: this.status,
      paymentStatus: this.paymentStatus,
      paymentIntentClientSecret: this.paymentIntentClientSecret,
      transactionId: this.transactionId,
      requestedAt: this.requestedAt,
      assignedAt: this.assignedAt,
      completedAt: this.completedAt,
      cancelledAt: this.cancelledAt,
      priority: this.priority,
    };
  }

  public static fromPrimitives(props: any): RideRequest {
    return new RideRequest({
      ...props,
      origin: Location.fromPrimitives(props.origin),
      destination: Location.fromPrimitives(props.destination),
      vehicleTypePreference: VehicleType.fromPrimitives(props.vehicleTypePreference),
      basePrice: Money.fromPrimitives(props.basePrice),
      seatPremium: Money.fromPrimitives(props.seatPremium),
      totalPrice: Money.fromPrimitives(props.totalPrice),
    });
  }
}
