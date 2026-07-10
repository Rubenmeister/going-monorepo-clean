import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ITourRepository } from '@going-monorepo-clean/domains-tour-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class PublishTourUseCase {
  constructor(
    @Inject(ITourRepository)
    private readonly repository: ITourRepository,
  ) {}

  /**
   * Ownership (auditoría Bloque 2 #19): antes cualquier usuario autenticado
   * publicaba el tour de OTRO host (BOLA). Ahora solo el host dueño (o un admin)
   * puede publicar.
   */
  async execute(
    id: UUID,
    requesterId?: string,
    isAdmin = false,
  ): Promise<{ status: string; message: string }> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Tour with ID ${id} not found.`);
    }

    const tour = result.value;
    if (
      !isAdmin &&
      (!requesterId || String(tour.hostId) !== String(requesterId))
    ) {
      throw new ForbiddenException('Solo el host dueño puede publicar este tour');
    }
    const publishResult = tour.publish();

    if (publishResult.isErr()) {
      throw new BadRequestException(publishResult.error.message);
    }

    const updateResult = await this.repository.update(tour);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }

    return { status: 'published', message: 'Tour published successfully' };
  }
}
