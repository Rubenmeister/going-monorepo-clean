import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID, Location } from '@going-monorepo-clean/shared-domain';

export type RouteStatus = 'active' | 'inactive';

export interface RouteStopProps {
  order: number;
  location: Location;
  estimatedArrivalMinutes: number;
}

export interface RouteProps {
  id: UUID;
  name: string;
  origin: Location;
  destination: Location;
  stops: RouteStopProps[];
  distanceKm: number;
  estimatedDurationMinutes: number;
  status: RouteStatus;
  createdAt: Date;
}

export class Route {
  readonly id: UUID;
  readonly name: string;
  readonly origin: Location;
  readonly destination: Location;
  readonly stops: RouteStopProps[];
  readonly distanceKm: number;
  readonly estimatedDurationMinutes: number;
  readonly status: RouteStatus;
  readonly createdAt: Date;

  private constructor(props: RouteProps) {
    this.id = props.id;
    this.name = props.name;
    this.origin = props.origin;
    this.destination = props.destination;
    this.stops = props.stops;
    this.distanceKm = props.distanceKm;
    this.estimatedDurationMinutes = props.estimatedDurationMinutes;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    name: string;
    origin: Location;
    destination: Location;
    stops?: RouteStopProps[];
    distanceKm: number;
    estimatedDurationMinutes: number;
  }): Result<Route, Error> {
    if (!props.name || props.name.length === 0) {
      return err(new Error('Route name is required'));
    }
    if (props.distanceKm <= 0) {
      return err(new Error('Distance must be positive'));
    }
    if (props.estimatedDurationMinutes <= 0) {
      return err(new Error('Estimated duration must be positive'));
    }

    const stops = props.stops || [];
    const sortedStops = [...stops].sort((a, b) => a.order - b.order);

    return ok(new Route({
      id: uuidv4(),
      name: props.name,
      origin: props.origin,
      destination: props.destination,
      stops: sortedStops,
      distanceKm: props.distanceKm,
      estimatedDurationMinutes: props.estimatedDurationMinutes,
      status: 'active',
      createdAt: new Date(),
    }));
  }

  public addStop(stop: RouteStopProps): Route {
    const newStops = [...this.stops, stop].sort((a, b) => a.order - b.order);
    return new Route({ ...this, stops: newStops });
  }

  public removeStop(order: number): Route {
    const newStops = this.stops.filter(s => s.order !== order);
    return new Route({ ...this, stops: newStops });
  }

  public deactivate(): Route {
    return new Route({ ...this, status: 'inactive' });
  }

  public activate(): Route {
    return new Route({ ...this, status: 'active' });
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      name: this.name,
      origin: this.origin.toPrimitives(),
      destination: this.destination.toPrimitives(),
      stops: this.stops.map(s => ({
        order: s.order,
        location: s.location.toPrimitives(),
        estimatedArrivalMinutes: s.estimatedArrivalMinutes,
      })),
      distanceKm: this.distanceKm,
      estimatedDurationMinutes: this.estimatedDurationMinutes,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Route {
    return new Route({
      ...props,
      origin: Location.fromPrimitives(props.origin),
      destination: Location.fromPrimitives(props.destination),
      stops: props.stops.map((s: any) => ({
        ...s,
        location: Location.fromPrimitives(s.location),
      })),
    });
  }
}
