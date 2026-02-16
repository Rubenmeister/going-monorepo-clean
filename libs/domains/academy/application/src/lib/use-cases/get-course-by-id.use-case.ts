import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ICourseRepository, Course } from '@going-monorepo-clean/domains-academy-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class GetCourseByIdUseCase {
  constructor(
    @Inject(ICourseRepository)
    private readonly repository: ICourseRepository,
  ) {}

  async execute(id: UUID): Promise<Course> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Course with ID ${id} not found.`);
    }
    return result.value;
  }
}
