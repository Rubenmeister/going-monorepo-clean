import { Trip } from '../entities/trip.entity';
import { UUID, Location } from '@going-monorepo-clean/shared-domain';
export declare const ITripRepository: unique symbol;
export interface ITripRepository {
    save(trip: Trip): Promise<void>;
    findById(id: UUID): Promise<Trip | null>;
    findAvailableSharedTrips(origen: Location, destino: Location, tipoVehiculo: 'SUV' | 'VAN'): Promise<Trip[]>;
    findTripsByDriverId(driverId: string): Promise<Trip[]>;
    update(trip: Trip): Promise<void>;
}
