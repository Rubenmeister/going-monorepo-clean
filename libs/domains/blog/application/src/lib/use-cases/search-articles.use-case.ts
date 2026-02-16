import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { IArticleRepository, ArticleSearchFilters } from '@going-monorepo-clean/domains-blog-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { SearchArticleDto } from '../dto/search-article.dto';

export type ArticleSearchResultDto = {
  id: UUID;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  mediaType: string;
  tags: string[];
  coverImageUrl?: string;
  publishedAt: Date | null;
};

@Injectable()
export class SearchArticlesUseCase {
  constructor(
    @Inject(IArticleRepository)
    private readonly articleRepo: IArticleRepository,
  ) {}

  async execute(filters: SearchArticleDto): Promise<ArticleSearchResultDto[]> {
    const result = await this.articleRepo.searchPublished(filters as ArticleSearchFilters);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((article) => {
      const p = article.toPrimitives();
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        category: p.category,
        mediaType: p.mediaType,
        tags: p.tags,
        coverImageUrl: p.coverImageUrl,
        publishedAt: p.publishedAt,
      };
    });
  }
}
