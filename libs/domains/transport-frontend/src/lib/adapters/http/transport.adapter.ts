import { Injectable } from '@nestjs/common';
import { ITripRepository, Trip } from '@going-monorepo-clean/domains-transport-core';
import { Location, UUID } from '@going-monorepo-clean/shared-domain';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class HttpTransportAdapter implements ITripRepository {
  async save(trip: Trip): Promise<Result<void, Error>> {
    try {
      // Lógica para llamar a transport-service
      const response = await fetch('/api/transport/create', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip) 
      });
      if (!response.ok) {
        return err(new Error('Failed to save trip'));
      }
      return ok(undefined);
    } catch (error: any) {
      return err(new Error(error.message || 'Network error'));
    }
  }

  async findById(id: UUID): Promise<Result<Trip, Error>> {
    try {
      const response = await fetch(`/api/transport/${id}`);
      if (!response.ok) {
        return err(new Error('Trip not found'));
      }
      const data = await response.json();
      return ok(data as Trip);
    } catch (error: any) {
      return err(new Error(error.message || 'Network error'));
    }
  }

  async findAvailableSharedTrips(origin: Location, dest: Location, vehicleType: 'SUV' | 'VAN'): Promise<Trip[]> {
    try {
      const response = await fetch('/api/transport/shared/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          origen: origin.toPrimitives(), 
          destino: dest.toPrimitives(), 
          tipoVehiculo: vehicleType 
        })
      });
      if (!response.ok) {
        return [];
      }
      return await response.json();
    } catch (error) {
      return [];
    }
  }

  async findTripsByDriverId(driverId: string): Promise<Trip[]> {
    try {
      const response = await fetch(`/api/transport/driver/${driverId}`);
      if (!response.ok) {
        return [];
      }
      return await response.json();
    } catch (error) {
      return [];
    }
  }

  async findAll(): Promise<Result<Trip[], Error>> {
    try {
      const response = await fetch('/api/transport');
      if (!response.ok) {
        return err(new Error('Failed to fetch trips'));
      }
      const data = await response.json();
      return ok(data as Trip[]);
    } catch (error: any) {
      return err(new Error(error.message || 'Network error'));
    }
  }

  async delete(id: UUID): Promise<Result<void, Error>> {
    try {
      const response = await fetch(`/api/transport/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        return err(new Error('Failed to delete trip'));
      }
      return ok(undefined);
    } catch (error: any) {
      return err(new Error(error.message || 'Network error'));
    }
  }
  async update(trip: Trip): Promise<void> {
    throw new Error('Method not implemented.');
  }
}