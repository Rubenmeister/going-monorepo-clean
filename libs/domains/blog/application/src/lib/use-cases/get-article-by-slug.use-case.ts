import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IArticleRepository, Article } from '@going-monorepo-clean/domains-blog-core';

@Injectable()
export class GetArticleBySlugUseCase {
  constructor(
    @Inject(IArticleRepository)
    private readonly repository: IArticleRepository,
  ) {}

  async execute(slug: string): Promise<Article> {
    const result = await this.repository.findBySlug(slug);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Article with slug "${slug}" not found.`);
    }
    return result.value;
  }
}
