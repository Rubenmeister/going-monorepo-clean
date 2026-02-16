import { Result } from 'neverthrow';
import { Shipment } from '../entities/shipment.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IShipmentRepository = Symbol('IShipmentRepository');

export interface IShipmentRepository {
  save(shipment: Shipment): Promise<Result<void, Error>>;
  update(shipment: Shipment): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Shipment | null, Error>>;
  findBySenderId(senderId: UUID): Promise<Result<Shipment[], Error>>;
  findByVehicleId(vehicleId: UUID): Promise<Result<Shipment[], Error>>;
  findPendingShipments(): Promise<Result<Shipment[], Error>>;
}
