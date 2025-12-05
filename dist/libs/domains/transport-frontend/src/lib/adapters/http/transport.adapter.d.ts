import { ITripRepository, Trip } from '@going-monorepo-clean/domains-transport-core';
import { Location } from '@going-monorepo-clean/shared-domain';
export declare class HttpTransportAdapter implements ITripRepository {
    save(trip: Trip): Promise<void>;
    findById(id: string): Promise<Trip | null>;
    findAvailableSharedTrips(origen: Location, destino: Location, tipoVehiculo: 'SUV' | 'VAN'): Promise<Trip[]>;
    findTripsByDriverId(driverId: string): Promise<Trip[]>;
    update(trip: Trip): Promise<void>;
}
