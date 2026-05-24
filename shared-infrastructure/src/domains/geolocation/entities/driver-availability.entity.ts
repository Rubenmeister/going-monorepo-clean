import { GeoLocation } from './geo-location.entity';

/**
 * DriverAvailability Entity
 * Represents the availability status of a driver
 */
export type DriverAvailabilityStatus = 'online' | 'busy' | 'offline';

export class DriverAvailability {
  driverId: string;
  status: DriverAvailabilityStatus;
  currentLocation: GeoLocation;
  availableSeats: number;
  serviceTypes: string[];
  lastUpdate: Date;

  constructor(props: {
    driverId: string;
    status: DriverAvailabilityStatus;
    currentLocation: GeoLocation;
    availableSeats: number;
    serviceTypes?: string[];
    lastUpdate?: Date;
  }) {
    this.driverId = props.driverId;
    this.status = props.status;
    this.currentLocation = props.currentLocation;
    this.availableSeats = props.availableSeats;
    // Default tier brand 'confort' (rename 2026-05-23 desde 'standard').
    // Drivers nuevos sin tier explícito quedan en confort hasta que ops
    // los promueva a premium (mejor vehículo / mejor rating).
    this.serviceTypes = props.serviceTypes || ['confort'];
    this.lastUpdate = props.lastUpdate || new Date();
  }

  isOnline(): boolean {
    return this.status === 'online';
  }

  isBusy(): boolean {
    return this.status === 'busy';
  }

  isOffline(): boolean {
    return this.status === 'offline';
  }

  isAvailable(): boolean {
    return this.isOnline() && this.availableSeats > 0;
  }

  setOffline(): void {
    this.status = 'offline';
    this.lastUpdate = new Date();
  }

  setOnline(): void {
    this.status = 'online';
    this.lastUpdate = new Date();
  }

  setBusy(): void {
    this.status = 'busy';
    this.lastUpdate = new Date();
  }

  updateLocation(location: GeoLocation): void {
    this.currentLocation = location;
    this.lastUpdate = new Date();
  }

  toObject() {
    return {
      driverId: this.driverId,
      status: this.status,
      currentLocation: this.currentLocation.toObject(),
      availableSeats: this.availableSeats,
      serviceTypes: this.serviceTypes,
      lastUpdate: this.lastUpdate,
    };
  }
}
