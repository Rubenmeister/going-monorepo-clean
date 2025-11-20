import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
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

export class Accommodation {
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

  private constructor(props: AccommodationProps) {
    this.id = props.id;
    this.hostId = props.hostId;
    this.title = props.title;
    this.description = props.description;
    this.location = props.location;
    this.pricePerNight = props.pricePerNight;
    this.capacity = props.capacity;
    this.amenities = props.amenities;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    hostId: UUID;
    title: string;
    description: string;
    location: Location;
    pricePerNight: Money;
    capacity: number;
    amenities?: string[];
  }): Result<Accommodation, Error> {
    
    if (props.title.length < 5) {
      return err(new Error('Title must be at least 5 characters'));
    }
    if (props.capacity <= 0) {
      return err(new Error('Capacity must be positive'));
    }

    const accommodation = new Accommodation({
      id: uuidv4(),
      ...props,
      amenities: props.amenities || [],
      status: 'draft',
      createdAt: new Date(),
    });
    return ok(accommodation);
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      hostId: this.hostId,
      title: this.title,
      description: this.description,
      location: this.location.toPrimitives(),
      pricePerNight: this.pricePerNight.toPrimitives(),
      capacity: this.capacity,
      amenities: this.amenities,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Accommodation {
    return new Accommodation({
      ...props,
      location: Location.fromPrimitives(props.location),
      pricePerNight: Money.fromPrimitives(props.pricePerNight),
    });
  }

  public publish(): void {
    if (this.status === 'draft') {
      (this as any).status = 'published';
    }
  }
}