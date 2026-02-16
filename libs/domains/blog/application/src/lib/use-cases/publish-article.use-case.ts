import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { IArticleRepository } from '@going-monorepo-clean/domains-blog-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class PublishArticleUseCase {
  constructor(
    @Inject(IArticleRepository)
    private readonly repository: IArticleRepository,
  ) {}

  async execute(id: UUID): Promise<void> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Article with ID ${id} not found.`);
    }

    const article = result.value;
    const publishResult = article.publish();

    if (publishResult.isErr()) {
      throw new PreconditionFailedException(publishResult.error.message);
    }

    const updateResult = await this.repository.update(article);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }
  }
}
