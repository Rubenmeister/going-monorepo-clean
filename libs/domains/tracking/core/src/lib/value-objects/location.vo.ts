import { Result, ok, err } from 'neverthrow';

export interface LocationProps {
  latitude: number;
  longitude: number;
}

export class Location {
  readonly latitude: number;
  readonly longitude: number;

  private constructor(props: LocationProps) {
    this.latitude = props.latitude;
    this.longitude = props.longitude;
  }

  public static create(props: LocationProps): Result<Location, Error> {
    if (props.latitude < -90 || props.latitude > 90) {
      return err(new Error('Invalid latitude'));
    }
    if (props.longitude < -180 || props.longitude > 180) {
      return err(new Error('Invalid longitude'));
    }
    return ok(new Location(props));
  }

  // --- Métodos de Persistencia ---
  
  public toPrimitives(): LocationProps {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }
  
  public static fromPrimitives(props: LocationProps): Location {
    return new Location(props);
  }
}