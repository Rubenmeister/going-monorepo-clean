export type TripStatus = 'SCHEDULED' | 'WAITING_PASSENGERS' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
export type VehicleType = 'SUV' | 'VAN';
export type TravelMode = 'DOOR_TO_DOOR' | 'POINT_TO_POINT';
interface TripPassenger {
    userId: string;
    originCity: string;
    originAddress: string;
    destCity: string;
    destAddress: string;
    pricePaid: number;
    currency: string;
    frontSeat: boolean;
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
    stationOrigin?: string;
    stationDest?: string;
    departureTime: Date;
    estimatedArrivalTime: Date;
    basePrice: number;
    pricePerPassenger: number;
    currency: string;
    createdAt: Date;
}
export declare class Trip {
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
    private constructor();
    static create(props: {
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
    }): Trip;
    static fromPrimitives(props: TripProps): Trip;
    toPrimitives(): TripProps;
    getMaxCapacity(): number;
    getAvailableSeats(): number;
    addPassenger(passenger: Omit<TripPassenger, 'pricePaid' | 'currency'>): void;
    private recalculatePricePerPassenger;
    assignDriver(driverId: string): void;
    start(): void;
    complete(): void;
    cancel(): void;
}
export {};
