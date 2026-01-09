import { Result } from 'neverthrow';
import { Money, UUID, Location } from '@going-monorepo-clean/shared-domain';
export type ParcelStatus = 'pending' | 'pickup_assigned' | 'in_transit' | 'delivered' | 'cancelled';
export interface ParcelProps {
    id: UUID;
    userId: UUID;
    driverId?: UUID;
    origin: Location;
    destination: Location;
    description: string;
    price: Money;
    status: ParcelStatus;
    createdAt: Date;
}
export declare class Parcel {
    readonly id: UUID;
    readonly userId: UUID;
    readonly driverId?: UUID;
    readonly origin: Location;
    readonly destination: Location;
    readonly description: string;
    readonly price: Money;
    readonly status: ParcelStatus;
    readonly createdAt: Date;
    private constructor();
    static create(props: {
        userId: UUID;
        origin: Location;
        destination: Location;
        description: string;
        price: Money;
    }): Result<Parcel, Error>;
    toPrimitives(): any;
    static fromPrimitives(props: any): Parcel;
    assignDriver(driverId: UUID): Result<void, Error>;
    markAsInTransit(): Result<void, Error>;
    deliver(): Result<void, Error>;
}
