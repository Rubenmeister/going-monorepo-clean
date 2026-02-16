import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class TripRequestedEvent implements DomainEvent {
  readonly eventName = 'transport.trip.requested';
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;

  constructor(
    public readonly tripId: string,
    public readonly userId: string,
    public readonly originCity: string,
    public readonly destinationCity: string,
  ) {
    this.occurredOn = new Date();
    this.payload = { tripId, userId, originCity, destinationCity };
  }
}
