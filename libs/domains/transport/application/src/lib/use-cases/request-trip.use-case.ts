import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  Trip,
  ITripRepository,
  TripRequestedEvent,
} from '@going-monorepo-clean/domains-transport-core';
import { Money, Location, UUID, IEventBus } from '@going-monorepo-clean/shared-domain';
import { RequestTripDto } from '../dto/request-trip.dto';

@Injectable()
export class RequestTripUseCase {
  private readonly logger = new Logger(RequestTripUseCase.name);

  constructor(
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
    @Inject(IEventBus)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: RequestTripDto): Promise<{ id: string }> {
    const priceVO = Money.fromPrimitives({ amount: dto.price.amount, currency: dto.price.currency as 'USD' });
    const originVOResult = Location.create(dto.origin);
    const destinationVOResult = Location.create(dto.destination);

    if (originVOResult.isErr()) {
      throw new InternalServerErrorException(originVOResult.error.message);
    }
    if (destinationVOResult.isErr()) {
      throw new InternalServerErrorException(destinationVOResult.error.message);
    }

    const tripResult = Trip.create({
      userId: dto.userId,
      origin: originVOResult.value,
      destination: destinationVOResult.value,
      price: priceVO,
    });

    if (tripResult.isErr()) {
      throw new InternalServerErrorException(tripResult.error.message);
    }

    const trip = tripResult.value;
    const saveResult = await this.tripRepo.save(trip);

    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }

    // Disparar evento para buscar conductores cercanos
    try {
      await this.eventBus.publish(
        new TripRequestedEvent(
          trip.id,
          dto.userId,
          dto.origin.city,
          dto.destination.city,
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to publish TripRequestedEvent: ${error.message}`);
    }

    return { id: trip.id };
  }
}
