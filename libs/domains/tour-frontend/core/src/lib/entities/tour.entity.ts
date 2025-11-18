import { UUID, Money, Location } from '@going-monorepo-clean/shared-domain';

export interface TourProps {
  id: UUID;
  title: string;
  description: string;
  location: Location;
  price: Money;
  durationHours: number;
  images: string[];
  rating: number;
}

export class Tour {
  readonly id: UUID;
  readonly title: string;
  readonly description: string;
  readonly location: Location;
  readonly price: Money;
  readonly durationHours: number;
  readonly images: string[];
  readonly rating: number;

  constructor(props: TourProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.location = props.location;
    this.price = props.price;
    this.durationHours = props.durationHours;
    this.images = props.images;
    this.rating = props.rating;
  }

  public static fromPrimitives(props: any): Tour {
    return new Tour({
      ...props,
      location: Location.fromPrimitives(props.location),
      price: Money.fromPrimitives(props.price),
    });
  }
}