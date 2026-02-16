import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class ShipmentAssignedEvent implements DomainEvent {
  readonly eventName = 'transport.shipment.assigned';
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;

  constructor(
    public readonly shipmentId: string,
    public readonly vehicleId: string,
    public readonly senderId: string,
    public readonly originCity: string,
    public readonly destinationCity: string,
  ) {
    this.occurredOn = new Date();
    this.payload = { shipmentId, vehicleId, senderId, originCity, destinationCity };
  }
}
