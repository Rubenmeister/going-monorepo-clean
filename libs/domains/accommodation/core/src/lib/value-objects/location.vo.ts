import { Result, ok, err } from 'neverthrow';

export interface LocationProps {
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export class Location {
  readonly address: string;
  readonly city: string;
  readonly country: string;
  readonly latitude: number;
  readonly longitude: number;

  private constructor(props: LocationProps) {
    this.address = props.address;
    this.city = props.city;
    this.country = props.country;
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
  
  public toPrimitives(): LocationProps {
    return { ...this };
  }
  
  public static fromPrimitives(props: LocationProps): Location {
    return new Location(props);
  }
}