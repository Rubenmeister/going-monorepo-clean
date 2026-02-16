import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  RideRequest,
  IRideRequestRepository,
  RideRequestCreatedEvent,
  VehicleType,
  SeatPosition,
} from '@going-monorepo-clean/domains-transport-core';
import { Money, Location, IEventBus } from '@going-monorepo-clean/shared-domain';
import { CreateRideRequestDto } from '../dto/create-ride-request.dto';

@Injectable()
export class CreateRideRequestUseCase {
  private readonly logger = new Logger(CreateRideRequestUseCase.name);
  private priorityCounter = 0;

  constructor(
    @Inject(IRideRequestRepository)
    private readonly rideRequestRepo: IRideRequestRepository,
    @Inject(IEventBus)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: CreateRideRequestDto): Promise<{ id: string }> {
    const originResult = Location.create(dto.origin);
    if (originResult.isErr()) throw new InternalServerErrorException(originResult.error.message);

    const destResult = Location.create(dto.destination);
    if (destResult.isErr()) throw new InternalServerErrorException(destResult.error.message);

    const vehicleTypeResult = VehicleType.create(dto.vehicleType);
    if (vehicleTypeResult.isErr()) throw new InternalServerErrorException(vehicleTypeResult.error.message);

    const basePriceVO = Money.fromPrimitives({
      amount: dto.basePrice.amount,
      currency: dto.basePrice.currency as 'USD',
    });

    this.priorityCounter++;

    const rideRequestResult = RideRequest.create({
      passengerId: dto.passengerId,
      origin: originResult.value,
      destination: destResult.value,
      vehicleTypePreference: vehicleTypeResult.value,
      rideType: dto.rideType,
      seatPreference: dto.seatPreference as SeatPosition,
      passengersCount: dto.passengersCount,
      basePrice: basePriceVO,
      priority: this.priorityCounter,
    });

    if (rideRequestResult.isErr()) {
      throw new InternalServerErrorException(rideRequestResult.error.message);
    }

    const rideRequest = rideRequestResult.value;
    const saveResult = await this.rideRequestRepo.save(rideRequest);
    if (saveResult.isErr()) throw new InternalServerErrorException(saveResult.error.message);

    try {
      await this.eventBus.publish(
        new RideRequestCreatedEvent(
          rideRequest.id,
          dto.passengerId,
          dto.vehicleType,
          dto.rideType,
          dto.origin.city,
          dto.destination.city,
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to publish RideRequestCreatedEvent: ${error.message}`);
    }

    return { id: rideRequest.id };
  }
}
