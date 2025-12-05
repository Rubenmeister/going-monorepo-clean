import { Injectable } from '@nestjs/common';
import { ITripRepository, Trip } from '@going-monorepo-clean/domains-transport-core';
import { Location } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class HttpTransportAdapter implements ITripRepository {
  async save(trip: Trip): Promise<void> {
    // Lógica para llamar a transport-service
    await fetch('/api/transport/create', { method: 'POST', body: JSON.stringify(trip) });
  }

  async findById(id: string): Promise<Trip | null> {
    throw new Error('Method not implemented.');
  }
  async findAvailableSharedTrips(origen: Location, destino: Location, tipoVehiculo: 'SUV' | 'VAN'): Promise<Trip[]> {
    throw new Error('Method not implemented.');
  }
  async findTripsByDriverId(driverId: string): Promise<Trip[]> {
    throw new Error('Method not implemented.');
  }
  async update(trip: Trip): Promise<void> {
    throw new Error('Method not implemented.');
  }
}