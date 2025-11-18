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

export class Accommodation {
  readonly id: UUID;
  readonly title: string;
  readonly description: string;
  readonly location: Location;
  readonly pricePerNight: Money;
  readonly images: string[];
  readonly rating: number;

  constructor(props: AccommodationProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.location = props.location;
    this.pricePerNight = props.pricePerNight;
    this.images = props.images;
    this.rating = props.rating;
  }

  public static fromPrimitives(props: any): Accommodation {
    return new Accommodation({
      ...props,
      location: Location.fromPrimitives(props.location),
      pricePerNight: Money.fromPrimitives(props.pricePerNight),
    });
  }
}