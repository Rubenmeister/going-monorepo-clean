import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class VehicleAssignedEvent implements DomainEvent {
  readonly eventName = 'transport.vehicle.assigned';
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;

  constructor(
    public readonly rideRequestId: string,
    public readonly vehicleId: string,
    public readonly driverId: string,
    public readonly passengerId: string,
    public readonly seatNumber: number,
    public readonly vehicleType: string,
    public readonly rideType: string,
  ) {
    this.occurredOn = new Date();
    this.payload = {
      rideRequestId, vehicleId, driverId,
      passengerId, seatNumber, vehicleType, rideType,
    };
  }
}
