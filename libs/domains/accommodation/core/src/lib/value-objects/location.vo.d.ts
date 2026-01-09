import { Result } from 'neverthrow';
export interface LocationProps {
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
}
export declare class Location {
    readonly address: string;
    readonly city: string;
    readonly country: string;
    readonly latitude: number;
    readonly longitude: number;
    private constructor();
    static create(props: LocationProps): Result<Location, Error>;
    toPrimitives(): LocationProps;
    static fromPrimitives(props: LocationProps): Location;
}
