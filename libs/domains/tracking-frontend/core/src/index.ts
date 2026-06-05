import { Result } from 'neverthrow';

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  updatedAt: Date;
}

export interface LocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
}

export const ITrackingGateway = Symbol('ITrackingGateway');

export interface ITrackingGateway {
  broadcastLocationUpdate(location: DriverLocation): Promise<Result<void, Error>>;
  subscribeToRoom(room: string): Promise<Result<void, Error>>;
  unsubscribeFromRoom(room: string): Promise<Result<void, Error>>;
}

export const IDriverLocationRepository = Symbol('IDriverLocationRepository');

export interface IDriverLocationRepository {
  findByDriverId(driverId: string, token: string): Promise<Result<DriverLocation | null, Error>>;
  getActiveDrivers(token?: string): Promise<Result<DriverLocation[], Error>>;
  updateLocation(update: LocationUpdate, token: string): Promise<Result<void, Error>>;
}

export const IUserLocationGateway = Symbol('IUserLocationGateway');

export interface IUserLocationGateway {
  getCurrentUserLocation(): Promise<Result<{ latitude: number; longitude: number }, Error>>;
  watchUserLocation(onUpdate: (location: { latitude: number; longitude: number }) => void): Promise<Result<void, Error>>;
  stopWatchingUserLocation(): void;
}
