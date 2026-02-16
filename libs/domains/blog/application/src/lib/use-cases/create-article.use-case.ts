import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Article,
  IArticleRepository,
} from '@going-monorepo-clean/domains-blog-core';
import { CreateArticleDto } from '../dto/create-article.dto';

@Injectable()
export class CreateArticleUseCase {
  constructor(
    @Inject(IArticleRepository)
    private readonly articleRepo: IArticleRepository,
  ) {}

  async execute(dto: CreateArticleDto): Promise<{ id: string }> {
    const articleResult = Article.create({
      authorId: dto.authorId,
      title: dto.title,
      content: dto.content,
      excerpt: dto.excerpt,
      category: dto.category,
      mediaType: dto.mediaType,
      tags: dto.tags,
      coverImageUrl: dto.coverImageUrl,
      videoUrl: dto.videoUrl,
    });

    if (articleResult.isErr()) {
      throw new InternalServerErrorException(articleResult.error.message);
    }
    const article = articleResult.value;

    const saveResult = await this.articleRepo.save(article);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return { id: article.id };
  }
}
