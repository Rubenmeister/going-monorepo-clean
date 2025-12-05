import { Money, Location } from '@going-monorepo-clean/shared-domain';

export type TourStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface TourProps {
  id: string;
  hostId: string;
  title: string;
  description: string;
  pricePerPerson: number;
  currency: string;
  maxCapacity: number;
  durationHours: number;
  location: string;
  meetingPoint: string;
  status: TourStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Tour {
  id: string;
  hostId: string;
  title: string;
  description: string;
  pricePerPerson: number;
  currency: string;
  maxCapacity: number;
  durationHours: number;
  location: string;
  meetingPoint: string;
  status: TourStatus;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: TourProps) {
    this.id = props.id;
    this.hostId = props.hostId;
    this.title = props.title;
    this.description = props.description;
    this.pricePerPerson = props.pricePerPerson;
    this.currency = props.currency;
    this.maxCapacity = props.maxCapacity;
    this.durationHours = props.durationHours;
    this.location = props.location;
    this.meetingPoint = props.meetingPoint;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: {
    hostId: string;
    title: string;
    description: string;
    pricePerPerson: number;
    currency: string;
    maxCapacity: number;
    durationHours: number;
    location: string;
    meetingPoint: string;
  }): Tour {
    return new Tour({
      id: crypto.randomUUID(),
      ...props,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPrimitives(props: TourProps): Tour {
    return new Tour(props);
  }

  public toPrimitives(): TourProps {
    return {
      id: this.id,
      hostId: this.hostId,
      title: this.title,
      description: this.description,
      pricePerPerson: this.pricePerPerson,
      currency: this.currency,
      maxCapacity: this.maxCapacity,
      durationHours: this.durationHours,
      location: this.location,
      meetingPoint: this.meetingPoint,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  publish(): void {
    if (this.status === 'PUBLISHED') {
      throw new Error('Tour is already published.');
    }
    this.status = 'PUBLISHED';
    this.updatedAt = new Date();
  }

  archive(): void {
    this.status = 'ARCHIVED';
    this.updatedAt = new Date();
  }

  update(props: Partial<Omit<TourProps, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>>): void {
    if (props.title) this.title = props.title;
    if (props.description) this.description = props.description;
    if (props.pricePerPerson) this.pricePerPerson = props.pricePerPerson;
    if (props.currency) this.currency = props.currency;
    if (props.maxCapacity) this.maxCapacity = props.maxCapacity;
    if (props.durationHours) this.durationHours = props.durationHours;
    if (props.location) this.location = props.location;
    if (props.meetingPoint) this.meetingPoint = props.meetingPoint;
    
    this.updatedAt = new Date();
  }
}
