import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class RideCompletedEvent implements DomainEvent {
  readonly eventName = 'transport.ride.completed';
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;

  constructor(
    public readonly rideRequestId: string,
    public readonly passengerId: string,
    public readonly totalAmountCents: number,
    public readonly totalCurrency: string,
  ) {
    this.occurredOn = new Date();
    this.payload = { rideRequestId, passengerId, totalAmountCents, totalCurrency };
  }
}
