import { Result, ok, err } from 'neverthrow';

export type TourStatus = 'draft' | 'published' | 'archived';

export interface TourProps {
  id: string;
  hostId: string;
  title: string;
  description: string;
  status: TourStatus;
  pricePerPerson: number;
  currency: string;
  maxCapacity: number;
  durationHours: number;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Tour {
  readonly id: string;
  readonly hostId: string;
  readonly title: string;
  readonly description: string;
  readonly status: TourStatus;
  readonly pricePerPerson: number;
  readonly currency: string;
  readonly maxCapacity: number;
  readonly durationHours: number;
  readonly location: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: TourProps) {
    this.id = props.id;
    this.hostId = props.hostId;
    this.title = props.title;
    this.description = props.description;
    this.status = props.status;
    this.pricePerPerson = props.pricePerPerson;
    this.currency = props.currency;
    this.maxCapacity = props.maxCapacity;
    this.durationHours = props.durationHours;
    this.location = props.location;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // Factory method para crear nuevo tour
  public static create(props: {
    hostId: string;
    title: string;
    description: string;
    pricePerPerson: number;
    currency?: string;
    maxCapacity: number;
    durationHours: number;
    location: string;
  }): Result<Tour, Error> {
    // Validaciones de negocio
    if (!props.hostId || props.hostId.length === 0) {
      return err(new Error('hostId is required'));
    }
    if (!props.title || props.title.length < 3) {
      return err(new Error('Title must be at least 3 characters'));
    }
    if (!props.description || props.description.length < 10) {
      return err(new Error('Description must be at least 10 characters'));
    }
    if (props.pricePerPerson <= 0) {
      return err(new Error('Price per person must be greater than 0'));
    }
    if (props.maxCapacity <= 0) {
      return err(new Error('Max capacity must be greater than 0'));
    }
    if (props.durationHours <= 0) {
      return err(new Error('Duration must be greater than 0 hours'));
    }
    if (!props.location || props.location.length < 3) {
      return err(new Error('Location must be at least 3 characters'));
    }

    const tour = new Tour({
      id: crypto.randomUUID(),
      ...props,
      currency: props.currency || 'USD',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return ok(tour);
  }

  // Lógica de negocio: Publicar tour
  public publish(): Result<Tour, Error> {
    if (this.status !== 'draft') {
      return err(new Error('Only draft tours can be published'));
    }

    return ok(
      new Tour({
        ...this,
        status: 'published',
        updatedAt: new Date(),
      })
    );
  }

  // Lógica de negocio: Archivar tour
  public archive(): Result<Tour, Error> {
    if (this.status === 'archived') {
      return err(new Error('Tour is already archived'));
    }

    return ok(
      new Tour({
        ...this,
        status: 'archived',
        updatedAt: new Date(),
      })
    );
  }

  // Lógica de negocio: Actualizar información
  public updateInfo(props: {
    title?: string;
    description?: string;
    pricePerPerson?: number;
    maxCapacity?: number;
    durationHours?: number;
    location?: string;
  }): Result<Tour, Error> {
    if (this.status === 'archived') {
      return err(new Error('Cannot update archived tour'));
    }

    // Validaciones
    if (props.title !== undefined && props.title.length < 3) {
      return err(new Error('Title must be at least 3 characters'));
    }
    if (props.description !== undefined && props.description.length < 10) {
      return err(new Error('Description must be at least 10 characters'));
    }
    if (props.pricePerPerson !== undefined && props.pricePerPerson <= 0) {
      return err(new Error('Price per person must be greater than 0'));
    }
    if (props.maxCapacity !== undefined && props.maxCapacity <= 0) {
      return err(new Error('Max capacity must be greater than 0'));
    }
    if (props.durationHours !== undefined && props.durationHours <= 0) {
      return err(new Error('Duration must be greater than 0 hours'));
    }

    return ok(
      new Tour({
        ...this,
        title: props.title ?? this.title,
        description: props.description ?? this.description,
        pricePerPerson: props.pricePerPerson ?? this.pricePerPerson,
        maxCapacity: props.maxCapacity ?? this.maxCapacity,
        durationHours: props.durationHours ?? this.durationHours,
        location: props.location ?? this.location,
        updatedAt: new Date(),
      })
    );
  }

  // Serialización para persistencia
  public toPrimitives(): TourProps {
    return {
      id: this.id,
      hostId: this.hostId,
      title: this.title,
      description: this.description,
      status: this.status,
      pricePerPerson: this.pricePerPerson,
      currency: this.currency,
      maxCapacity: this.maxCapacity,
      durationHours: this.durationHours,
      location: this.location,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Deserialización desde persistencia
  public static fromPrimitives(props: TourProps): Tour {
    return new Tour(props);
  }
}
