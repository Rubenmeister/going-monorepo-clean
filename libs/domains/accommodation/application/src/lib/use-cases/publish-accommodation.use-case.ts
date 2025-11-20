import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class PublishAccommodationUseCase {
  constructor(
    @Inject(IAccommodationRepository)
    private readonly repository: IAccommodationRepository,
  ) {}

  async execute(id: UUID): Promise<void> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Accommodation with ID ${id} not found.`);
    }

    // Lógica de negocio en la entidad
    result.value.publish();

    // Actualizar el repositorio
    await this.repository.update(result.value);
  }
}