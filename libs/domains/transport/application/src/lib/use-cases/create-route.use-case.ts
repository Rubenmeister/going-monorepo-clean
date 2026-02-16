import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Route, IRouteRepository } from '@going-monorepo-clean/domains-transport-core';
import { Location } from '@going-monorepo-clean/shared-domain';
import { CreateRouteDto } from '../dto/create-route.dto';

@Injectable()
export class CreateRouteUseCase {
  constructor(
    @Inject(IRouteRepository)
    private readonly routeRepo: IRouteRepository,
  ) {}

  async execute(dto: CreateRouteDto): Promise<{ id: string }> {
    const originResult = Location.create(dto.origin);
    if (originResult.isErr()) throw new InternalServerErrorException(originResult.error.message);

    const destResult = Location.create(dto.destination);
    if (destResult.isErr()) throw new InternalServerErrorException(destResult.error.message);

    const stops = (dto.stops || []).map(s => {
      const locResult = Location.create(s.location);
      if (locResult.isErr()) throw new InternalServerErrorException(locResult.error.message);
      return {
        order: s.order,
        location: locResult.value,
        estimatedArrivalMinutes: s.estimatedArrivalMinutes,
      };
    });

    const routeResult = Route.create({
      name: dto.name,
      origin: originResult.value,
      destination: destResult.value,
      stops,
      distanceKm: dto.distanceKm,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
    });

    if (routeResult.isErr()) throw new InternalServerErrorException(routeResult.error.message);

    const route = routeResult.value;
    const saveResult = await this.routeRepo.save(route);
    if (saveResult.isErr()) throw new InternalServerErrorException(saveResult.error.message);

    return { id: route.id };
  }
}
