import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Tour, ITourRepository } from '@going-monorepo-clean/domains-tour-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';
import { CreateTourDto } from '../dto/create-tour.dto';

@Injectable()
export class CreateTourUseCase {
  constructor(
    @Inject(ITourRepository)
    private readonly tourRepo: ITourRepository
  ) {}

  async execute(dto: CreateTourDto): Promise<{ id: string }> {
    const locationVOResult = Location.create(dto.location);
    if (locationVOResult.isErr()) {
      throw new InternalServerErrorException(locationVOResult.error.message);
    }
    const locationVO = locationVOResult.value;
    const priceVO = Money.fromPrimitives({
      amount: dto.price.amount,
      currency: dto.price.currency as 'USD',
    });

    const tourResult = Tour.create({
      hostId: dto.hostId,
      title: dto.title,
      description: dto.description,
      location: locationVO,
      price: priceVO,
      durationHours: dto.durationHours,
      maxGuests: dto.maxGuests,
      category: dto.category,
    });

    if (tourResult.isErr()) {
      throw new InternalServerErrorException(tourResult.error.message);
    }
    const tour = tourResult.value;
    // Auditoría Bloque 2 #20: NO auto-publicar al crear. Antes `tour.publish()`
    // metía el listado directo al catálogo público → cualquier usuario
    // autenticado inyectaba tours públicos con un solo POST. El tour queda sin
    // publicar y requiere un PATCH /tours/:id/publish explícito (que ahora valida
    // que quien publica sea el host dueño — #19).

    const saveResult = await this.tourRepo.save(tour);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return { id: tour.id };
  }
}
