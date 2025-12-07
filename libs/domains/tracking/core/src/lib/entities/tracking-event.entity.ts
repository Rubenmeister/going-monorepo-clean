import { Result, ok, err } from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';

export interface TrackingEventProps {
  id: string;
  parcelId: string;
  status: string;
  location?: string | null;
  description?: string | null;
  timestamp: Date;
}

export class TrackingEvent {
  readonly id: string;
  readonly parcelId: string;
  readonly status: string;
  readonly location: string | null;
  readonly description: string | null;
  readonly timestamp: Date;

  private constructor(props: TrackingEventProps) {
    this.id = props.id;
    this.parcelId = props.parcelId;
    this.status = props.status;
    this.location = props.location ?? null;
    this.description = props.description ?? null;
    this.timestamp = props.timestamp;
  }

  public static create(props: {
    parcelId: string;
    status: string;
    location?: string;
    description?: string;
  }): Result<TrackingEvent, Error> {
    if (!props.parcelId) return err(new Error('Parcel ID is required'));
    if (!props.status) return err(new Error('Status is required'));

    return ok(
      new TrackingEvent({
        id: uuidv4(),
        parcelId: props.parcelId,
        status: props.status,
        location: props.location,
        description: props.description,
        timestamp: new Date(),
      })
    );
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      parcelId: this.parcelId,
      status: this.status,
      location: this.location,
      description: this.description,
      timestamp: this.timestamp,
    };
  }

  public static fromPrimitives(props: any): TrackingEvent {
    return new TrackingEvent({
      id: props.id,
      parcelId: props.parcelId,
      status: props.status,
      location: props.location,
      description: props.description,
      timestamp: new Date(props.timestamp),
    });
  }
}
