import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID, Money } from '@going-monorepo-clean/shared-domain';
import { Location } from '@going-monorepo-clean/shared-domain'; // Asumiendo que Location está en shared

export type ExperienceStatus = 'draft' | 'published' | 'archived';

export interface ExperienceProps {
  id: UUID;
  hostId: UUID;
  title: string;
  description: string;
  location: Location;
  price: Money;
  durationHours: number;
  status: ExperienceStatus;
  createdAt: Date;
}

export class Experience {
  readonly id: UUID;
  readonly hostId: UUID;
  readonly title: string;
  readonly description: string;
  readonly location: Location;
  readonly price: Money;
  readonly durationHours: number;
  readonly status: ExperienceStatus;
  readonly createdAt: Date;

  private constructor(props: ExperienceProps) {
    this.id = props.id;
    this.hostId = props.hostId;
    this.title = props.title;
    this.description = props.description;
    this.location = props.location;
    this.price = props.price;
    this.durationHours = props.durationHours;
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
  }): Result<Experience, Error> {
    
    if (props.title.length < 5) {
      return err(new Error('Title must be at least 5 characters'));
    }
    if (props.durationHours <= 0) {
      return err(new Error('Duration must be positive'));
    }

    const experience = new Experience({
      id: uuidv4(),
      ...props,
      status: 'draft',
      createdAt: new Date(),
    });
    return ok(experience);
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
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Experience {
    return new Experience({
      ...props,
      location: Location.fromPrimitives(props.location),
      price: Money.fromPrimitives(props.price),
    });
  }

  public publish(): Result<void, Error> {
    if (this.status !== 'draft') {
      return err(new Error('Experience is not a draft'));
    }
    (this as any).status = 'published';
    return ok(undefined);
  }
}