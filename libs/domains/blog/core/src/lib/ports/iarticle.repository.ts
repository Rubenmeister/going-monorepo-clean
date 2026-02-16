import { Result } from 'neverthrow';
import { Article, ArticleCategory, MediaType } from '../entities/article.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IArticleRepository = Symbol('IArticleRepository');

export interface ArticleSearchFilters {
  category?: ArticleCategory;
  mediaType?: MediaType;
  tag?: string;
  title?: string;
}

export interface IArticleRepository {
  save(article: Article): Promise<Result<void, Error>>;
  update(article: Article): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Article | null, Error>>;
  findBySlug(slug: string): Promise<Result<Article | null, Error>>;
  findByAuthorId(authorId: UUID): Promise<Result<Article[], Error>>;
  searchPublished(filters: ArticleSearchFilters): Promise<Result<Article[], Error>>;
}
