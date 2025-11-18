import { UUID, Money, Location } from '@going-monorepo-clean/shared-domain';

export type ParcelStatus =
  | 'pending'
  | 'pickup_assigned'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

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

export class Parcel {
  readonly id: UUID;
  readonly userId: UUID;
  readonly driverId?: UUID;
  readonly origin: Location;
  readonly destination: Location;
  readonly description: string;
  readonly price: Money;
  readonly status: ParcelStatus;
  readonly createdAt: Date;

  constructor(props: ParcelProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.driverId = props.driverId;
    this.origin = props.origin;
    this.destination = props.destination;
    this.description = props.description;
    this.price = props.price;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  public static fromPrimitives(props: any): Parcel {
    return new Parcel({
      ...props,
      origin: Location.fromPrimitives(props.origin),
      destination: Location.fromPrimitives(props.destination),
      price: Money.fromPrimitives(props.price),
    });
  }
}