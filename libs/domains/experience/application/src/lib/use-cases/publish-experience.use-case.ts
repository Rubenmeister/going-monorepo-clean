import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { IExperienceRepository } from '@going-monorepo-clean/domains-experience-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * PublishExperienceUseCase — publica una experiencia al catálogo público.
 *
 * Modelo de negocio (aclarado por Rubén): un operador local (experto o persona
 * con recorrido) publica sus experiencias igual que un alojamiento o una
 * operadora de tours. Por eso la experiencia se crea en 'draft' y requiere un
 * publish EXPLÍCITO del dueño — no se auto-publica al crear.
 *
 * Ownership (auditoría Bloque 2 #19, mismo patrón que tours/anfitriones): solo
 * el host dueño (o un admin) puede publicar. Antes cualquier usuario autenticado
 * habría publicado la experiencia de otro.
 */
@Injectable()
export class PublishExperienceUseCase {
  constructor(
    @Inject(IExperienceRepository)
    private readonly repository: IExperienceRepository,
  ) {}

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
      throw new NotFoundException(`Experience with ID ${id} not found.`);
    }

    const experience = result.value;
    if (
      !isAdmin &&
      (!requesterId || String(experience.hostId) !== String(requesterId))
    ) {
      throw new ForbiddenException(
        'Solo el operador dueño puede publicar esta experiencia',
      );
    }

    const publishResult = experience.publish();
    if (publishResult.isErr()) {
      throw new BadRequestException(publishResult.error.message);
    }

    const updateResult = await this.repository.update(experience);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }

    return { status: 'published', message: 'Experience published successfully' };
  }
}
