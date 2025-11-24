import { UUID, Money, Location } from '@going-monorepo-clean/shared-domain';
export interface AccommodationProps {
    id: UUID;
    title: string;
    description: string;
    location: Location;
    pricePerNight: Money;
    images: string[];
    rating: number;
}
export declare class Accommodation {
    readonly id: UUID;
    readonly title: string;
    readonly description: string;
    readonly location: Location;
    readonly pricePerNight: Money;
    readonly images: string[];
    readonly rating: number;
    constructor(props: AccommodationProps);
    static fromPrimitives(props: any): Accommodation;
}
