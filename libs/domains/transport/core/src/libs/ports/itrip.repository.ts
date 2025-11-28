import { Trip } from '../entities/trip.entity';
import { UUIDVO } from '@myorg/shared/domain/uuid.vo';
import { LocationVO } from '@myorg/shared/domain/location.vo';

export interface ITripRepository {
  save(trip: Trip): Promise<void>;
  findById(id: UUIDVO): Promise<Trip | null>;
  findAvailableSharedTrips(origen: LocationVO, destino: LocationVO, tipoVehiculo: 'SUV' | 'VAN'): Promise<Trip[]>;
  findTripsByDriverId(driverId: string): Promise<Trip[]>;
  update(trip: Trip): Promise<void>;
}