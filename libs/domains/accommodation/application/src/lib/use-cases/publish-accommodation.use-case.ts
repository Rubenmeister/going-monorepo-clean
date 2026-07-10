import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class PublishAccommodationUseCase {
  constructor(
    @Inject(IAccommodationRepository)
    private readonly repository: IAccommodationRepository,
  ) {}

  /**
   * Ownership (auditoría Bloque 2 #19, mismo patrón que tours): solo el host
   * dueño (o admin) publica su alojamiento. Antes cualquier usuario autenticado
   * publicaba el de otro host (BOLA).
   */
  async execute(
    id: UUID,
    requesterId?: string,
    isAdmin = false,
  ): Promise<void> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Accommodation with ID ${id} not found.`);
    }

    const accommodation = result.value as any;
    if (
      !isAdmin &&
      (!requesterId || String(accommodation.hostId) !== String(requesterId))
    ) {
      throw new ForbiddenException(
        'Solo el host dueño puede publicar este alojamiento',
      );
    }

    // Lógica de negocio en la entidad
    result.value.publish();

    // Actualizar el repositorio
    await this.repository.update(result.value);
  }
}