import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class ShipmentDeliveredEvent implements DomainEvent {
  readonly eventName = 'transport.shipment.delivered';
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;

  constructor(
    public readonly shipmentId: string,
    public readonly senderId: string,
    public readonly amountCents: number,
    public readonly currency: string,
  ) {
    this.occurredOn = new Date();
    this.payload = { shipmentId, senderId, amountCents, currency };
  }
}
