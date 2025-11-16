import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID, Money } from '@going-monorepo-clean/shared-domain';
import { Location } from '@going-monorepo-clean/shared-domain'; // Asumiendo que Location está en shared

export type TourCategory = 'ADVENTURE' | 'CULTURAL' | 'GASTRONOMY' | 'NATURE';
export type TourStatus = 'draft' | 'published' | 'archived';

export interface TourProps {
  id: UUID;
  hostId: UUID;
  title: string;
  description: string;
  location: Location;
  price: Money;
  durationHours: number;
  maxGuests: number;
  category: TourCategory;
  status: TourStatus;
  createdAt: Date;
}

export class Tour {
  readonly id: UUID;
  readonly hostId: UUID;
  readonly title: string;
  readonly description: string;
  readonly location: Location;
  readonly price: Money;
  readonly durationHours: number;
  readonly maxGuests: number;
  readonly category: TourCategory;
  readonly status: TourStatus;
  readonly createdAt: Date;

  private constructor(props: TourProps) {
    this.id = props.id;
    this.hostId = props.hostId;
    this.title = props.title;
    this.description = props.description;
    this.location = props.location;
    this.price = props.price;
    this.durationHours = props.durationHours;
    this.maxGuests = props.maxGuests;
    this.category = props.category;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    hostId: UUID;
    title: string;
    description: string;
    location: Location;
    price: Money;
    durationHours: number;
    maxGuests: number;
    category: TourCategory;
  }): Result<Tour, Error> {
    
    if (props.title.length < 5) {
      return err(new Error('Tour title must be at least 5 characters'));
    }
    if (props.durationHours <= 0) {
      return err(new Error('Tour duration must be positive'));
    }

    const tour = new Tour({
      id: uuidv4(),
      ...props,
      status: 'draft',
      createdAt: new Date(),
    });

    return ok(tour);
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      hostId: this.hostId,
      title: this.title,
      description: this.description,
      location: this.location.toPrimitives(),
      price: this.price.toPrimitives(),
      durationHours: this.durationHours,
      maxGuests: this.maxGuests,
      category: this.category,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Tour {
    return new Tour({
      ...props,
      location: Location.fromPrimitives(props.location),
      price: Money.fromPrimitives(props.price),
    });
  }

  public publish(): Result<void, Error> {
    if (this.status === 'published') {
      return err(new Error('Tour is already published'));
    }
    if (this.status === 'archived') {
      return err(new Error('Cannot publish an archived tour'));
    }
    (this as any).status = 'published';
    return ok(undefined);
  }
}