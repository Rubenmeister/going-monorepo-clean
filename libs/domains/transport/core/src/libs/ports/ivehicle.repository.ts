import { Result } from 'neverthrow';
import { Vehicle } from '../entities/vehicle.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { VehicleTypeEnum } from '../value-objects/vehicle-type.vo';

export const IVehicleRepository = Symbol('IVehicleRepository');

export interface IVehicleRepository {
  save(vehicle: Vehicle): Promise<Result<void, Error>>;
  update(vehicle: Vehicle): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Vehicle | null, Error>>;
  findByDriverId(driverId: UUID): Promise<Result<Vehicle[], Error>>;
  findByPlate(plate: string): Promise<Result<Vehicle | null, Error>>;
  findActiveByType(type: VehicleTypeEnum): Promise<Result<Vehicle[], Error>>;
  findAvailableVehiclesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    vehicleType?: VehicleTypeEnum,
  ): Promise<Result<Vehicle[], Error>>;
}
