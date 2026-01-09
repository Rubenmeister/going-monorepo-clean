import { Result } from 'neverthrow';
import { UUID, Money } from '@going-monorepo-clean/shared-domain';
import { Location } from '../value-objects/location.vo';
export type AccommodationStatus = 'draft' | 'published' | 'archived';
export interface AccommodationProps {
    id: UUID;
    hostId: UUID;
    title: string;
    description: string;
    location: Location;
    pricePerNight: Money;
    capacity: number;
    amenities: string[];
    status: AccommodationStatus;
    createdAt: Date;
}
export declare class Accommodation {
    readonly id: UUID;
    readonly hostId: UUID;
    readonly title: string;
    readonly description: string;
    readonly location: Location;
    readonly pricePerNight: Money;
    readonly capacity: number;
    readonly amenities: string[];
    readonly status: AccommodationStatus;
    readonly createdAt: Date;
    private constructor();
    static create(props: {
        hostId: UUID;
        title: string;
        description: string;
        location: Location;
        pricePerNight: Money;
        capacity: number;
        amenities?: string[];
    }): Result<Accommodation, Error>;
    toPrimitives(): any;
    static fromPrimitives(props: any): Accommodation;
    publish(): void;
}
