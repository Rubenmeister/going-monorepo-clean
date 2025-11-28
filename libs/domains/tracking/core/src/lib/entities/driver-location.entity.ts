import { LocationVO } from '@myorg/shared/domain/location.vo';
import { DriverId } from './driver.entity'; // Asumiendo que existe
import { TripId } from '@myorg/domains/transport/core'; // Importar desde transport

export class DriverLocation {
  driverId: DriverId;
  tripId?: TripId; // Opcional: puede no estar en un viaje
  location: LocationVO;
  timestamp: Date;
  speed?: number; // km/h
  heading?: number; // grados

  constructor(props: {
    driverId: DriverId;
    location: LocationVO;
    tripId?: TripId;
    speed?: number;
    heading?: number;
  }) {
    this.driverId = props.driverId;
    this.location = props.location;
    this.tripId = props.tripId;
    this.timestamp = new Date();
    this.speed = props.speed;
    this.heading = props.heading;
  }
}