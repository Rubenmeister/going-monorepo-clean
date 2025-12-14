import { Location, Money } from '@going-monorepo-clean/shared-domain';

export type TripStatus = 'SCHEDULED' | 'WAITING_PASSENGERS' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
export type VehicleType = 'SUV' | 'VAN';
export type TravelMode = 'DOOR_TO_DOOR' | 'POINT_TO_POINT';

// Passenger in a shared trip
interface TripPassenger {
  userId: string;
  originCity: string;
  originAddress: string;
  destCity: string;
  destAddress: string;
  pricePaid: number;
  currency: string;
  frontSeat: boolean; // Only for SUV
}

export interface TripProps {
  id: string;
  driverId: string;
  vehicleType: VehicleType;
  mode: TravelMode;
  status: TripStatus;
  passengers: TripPassenger[];
  originCity: string;
  originAddress: string;
  destCity: string;
  destAddress: string;
  stationOrigin?: string; // For VAN only
  stationDest?: string; // For VAN only
  departureTime: Date;
  estimatedArrivalTime: Date;
  basePrice: number;
  pricePerPassenger: number;
  currency: string;
  createdAt: Date;
}

export class Trip {
  id: string;
  driverId: string;
  vehicleType: VehicleType;
  mode: TravelMode;
  status: TripStatus;
  passengers: TripPassenger[];
  originCity: string;
  originAddress: string;
  destCity: string;
  destAddress: string;
  stationOrigin?: string;
  stationDest?: string;
  departureTime: Date;
  estimatedArrivalTime: Date;
  basePrice: number;
  pricePerPassenger: number;
  currency: string;
  readonly createdAt: Date;

  private constructor(props: TripProps) {
    this.id = props.id;
    this.driverId = props.driverId;
    this.vehicleType = props.vehicleType;
    this.mode = props.mode;
    this.status = props.status;
    this.passengers = props.passengers;
    this.originCity = props.originCity;
    this.originAddress = props.originAddress;
    this.destCity = props.destCity;
    this.destAddress = props.destAddress;
    this.stationOrigin = props.stationOrigin;
    this.stationDest = props.stationDest;
    this.departureTime = props.departureTime;
    this.estimatedArrivalTime = props.estimatedArrivalTime;
    this.basePrice = props.basePrice;
    this.pricePerPassenger = props.pricePerPassenger;
    this.currency = props.currency;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    driverId: string;
    vehicleType: VehicleType;
    mode: TravelMode;
    originCity: string;
    originAddress: string;
    destCity: string;
    destAddress: string;
    stationOrigin?: string;
    stationDest?: string;
    departureTime: Date;
    basePrice: number;
    currency: string;
  }): Trip {
    const estimatedArrivalTime = new Date(props.departureTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    
    return new Trip({
      id: crypto.randomUUID(),
      ...props,
      status: 'SCHEDULED',
      passengers: [],
      estimatedArrivalTime,
      pricePerPassenger: props.basePrice,
      createdAt: new Date(),
    });
  }

  public static fromPrimitives(props: TripProps): Trip {
    return new Trip(props);
  }

  public toPrimitives(): TripProps {
    return {
      id: this.id,
      driverId: this.driverId,
      vehicleType: this.vehicleType,
      mode: this.mode,
      status: this.status,
      passengers: this.passengers,
      originCity: this.originCity,
      originAddress: this.originAddress,
      destCity: this.destCity,
      destAddress: this.destAddress,
      stationOrigin: this.stationOrigin,
      stationDest: this.stationDest,
      departureTime: this.departureTime,
      estimatedArrivalTime: this.estimatedArrivalTime,
      basePrice: this.basePrice,
      pricePerPassenger: this.pricePerPassenger,
      currency: this.currency,
      createdAt: this.createdAt,
    };
  }

  getMaxCapacity(): number {
    return this.vehicleType === 'VAN' ? 7 : 3;
  }

  getAvailableSeats(): number {
    return this.getMaxCapacity() - this.passengers.length;
  }

  addPassenger(passenger: Omit<TripPassenger, 'pricePaid' | 'currency'>): void {
    if (this.getAvailableSeats() <= 0) {
      throw new Error('No seats available.');
    }

    if (this.vehicleType === 'SUV' && passenger.frontSeat && this.passengers.some(p => p.frontSeat)) {
      throw new Error('Only one passenger can have the front seat in SUV.');
    }

    this.passengers.push({
      ...passenger,
      pricePaid: this.pricePerPassenger,
      currency: this.currency,
    });

    if (this.passengers.length > 1) {
      this.recalculatePricePerPassenger();
    }

    if (this.getAvailableSeats() === 0) {
      this.status = 'WAITING_PASSENGERS';
    }
  }

  private recalculatePricePerPassenger(): void {
    const shareDiscount = this.passengers.length === 2 ? 0.6 : this.passengers.length === 3 ? 0.45 : 1.0;
    this.pricePerPassenger = this.basePrice * shareDiscount;
    
    for (const p of this.passengers) {
      p.pricePaid = this.pricePerPassenger;
    }
  }

  assignDriver(driverId: string): void {
    if (this.status !== 'SCHEDULED') {
      throw new Error('Cannot assign driver to a trip that is not scheduled.');
    }
    this.driverId = driverId;
  }

  start(): void {
    if (this.status !== 'SCHEDULED' && this.status !== 'WAITING_PASSENGERS') {
      throw new Error('Cannot start trip in current state.');
    }
    this.status = 'IN_TRANSIT';
  }

  complete(): void {
    if (this.status !== 'IN_TRANSIT') {
      throw new Error('Only in-transit trips can be completed.');
    }
    this.status = 'COMPLETED';
  }

  cancel(): void {
    if (this.status === 'COMPLETED' || this.status === 'CANCELLED') {
      throw new Error('Cannot cancel completed or already cancelled trip.');
    }
    this.status = 'CANCELLED';
  }
}