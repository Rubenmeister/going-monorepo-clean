import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';

// Experience status
export type ExperienceStatus = 'draft' | 'published' | 'archived';

export interface ExperienceProps {
  id: string;
  hostId: string;
  title: string;
  description: string;
  pricePerPerson: number;
  maxCapacity: number;
  location: string;
  status: ExperienceStatus;
  createdAt: Date;
}

export class Experience {
  readonly id: string;
  readonly hostId: string;
  readonly title: string;
  readonly description: string;
  readonly pricePerPerson: number;
  readonly maxCapacity: number;
  readonly location: string;
  readonly status: ExperienceStatus;
  readonly createdAt: Date;

  private constructor(props: ExperienceProps) {
    this.id = props.id;
    this.hostId = props.hostId;
    this.title = props.title;
    this.description = props.description;
    this.pricePerPerson = props.pricePerPerson;
    this.maxCapacity = props.maxCapacity;
    this.location = props.location;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  public static create(props: Omit<ExperienceProps, 'id' | 'status' | 'createdAt'>): Result<Experience, Error> {
    if (props.pricePerPerson <= 0) {
      return err(new Error('Price must be greater than zero.'));
    }
    
    const experience = new Experience({
      ...props,
      id: uuidv4(),
      status: 'draft',
      createdAt: new Date(),
    });

    return ok(experience);
  }
  
  public publish(): Result<void, Error> {
    if (this.status === 'published') {
      return err(new Error('Experience is already published.'));
    }
    (this as any).status = 'published'; 
    return ok(undefined);
  }

  public calculateTotalPrice(people: number): Result<number, Error> {
    if (people > this.maxCapacity) {
      return err(new Error('Capacity exceeded.'));
    }
    return ok(people * this.pricePerPerson);
  }

  public toPrimitives(): ExperienceProps {
    return {
      id: this.id,
      hostId: this.hostId,
      title: this.title,
      description: this.description,
      pricePerPerson: this.pricePerPerson,
      maxCapacity: this.maxCapacity,
      location: this.location,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: ExperienceProps): Experience {
    return new Experience(props);
  }
}