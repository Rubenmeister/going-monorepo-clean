import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { RequestTripDto } from '../dto/request-trip.dto';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-frontend-core';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

export interface TripViewModel {
  id: string;
  status: string;
  originCity: string;
  destinationCity: string;
  price: number;
}

@Injectable()
export class RequestTripUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepository: ITripRepository,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: RequestTripDto, token: string): Promise<Result<TripViewModel, Error>> {
    const priceVOResult = Money.create(dto.price.amount, dto.price.currency);
    if (priceVOResult.isErr()) return err(priceVOResult.error);

    const result = await this.tripRepository.requestTrip(
      {
        userId: dto.userId,
        origin: dto.origin,
        destination: dto.destination,
        price: priceVOResult.value.toPrimitives(),
      },
      token,
    );

    if (result.isErr()) return err(result.error);

    const trip = result.value;
    const viewModel: TripViewModel = {
      id: trip.id,
      status: trip.status,
      originCity: trip.origin.city,
      destinationCity: trip.destination.city,
      price: trip.price.amount / 100,
    };

    return ok(viewModel);
  }
}
