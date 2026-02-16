import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class RideRequestCreatedEvent implements DomainEvent {
  readonly eventName = 'transport.ride-request.created';
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;

  constructor(
    public readonly rideRequestId: string,
    public readonly passengerId: string,
    public readonly vehicleType: string,
    public readonly rideType: string,
    public readonly originCity: string,
    public readonly destinationCity: string,
  ) {
    this.occurredOn = new Date();
    this.payload = {
      rideRequestId, passengerId, vehicleType,
      rideType, originCity, destinationCity,
    };
  }
}
