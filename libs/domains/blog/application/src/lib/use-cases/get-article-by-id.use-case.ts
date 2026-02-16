import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IArticleRepository, Article } from '@going-monorepo-clean/domains-blog-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class GetArticleByIdUseCase {
  constructor(
    @Inject(IArticleRepository)
    private readonly repository: IArticleRepository,
  ) {}

  async execute(id: UUID): Promise<Article> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Article with ID ${id} not found.`);
    }
    return result.value;
  }
}
