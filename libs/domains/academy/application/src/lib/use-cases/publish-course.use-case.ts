import { Inject, Injectable, InternalServerErrorException, NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { ICourseRepository } from '@going-monorepo-clean/domains-academy-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class PublishCourseUseCase {
  constructor(
    @Inject(ICourseRepository)
    private readonly repository: ICourseRepository,
  ) {}

  async execute(id: UUID): Promise<void> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Course with ID ${id} not found.`);
    }

    const publishResult = result.value.publish();
    if (publishResult.isErr()) {
      throw new PreconditionFailedException(publishResult.error.message);
    }

    const updateResult = await this.repository.update(result.value);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }
  }
}
