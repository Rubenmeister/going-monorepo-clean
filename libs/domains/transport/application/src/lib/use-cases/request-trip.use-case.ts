import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Trip,
  ITripRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { Money, Location, UUID } from '@going-monorepo-clean/shared-domain';
import { RequestTripDto } from '../dto/request-trip.dto';

@Injectable()
export class RequestTripUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
    // Aquí también podrías inyectar un "EventBus" para notificar a los conductores
    // @Inject(IEventBus) private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: RequestTripDto): Promise<{ id: string }> {
    const priceVO = new Money(dto.price.amount, dto.price.currency as 'USD');
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
    
    // 4. (Opcional) Disparar un evento para buscar conductores
    // await this.eventBus.publish(new TripRequestedEvent(trip.id, trip.origin));

    return { id: trip.id };
  }
}