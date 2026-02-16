import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export enum ArticleCategory {
  NEWS = 'NEWS',
  TRAVEL = 'TRAVEL',
  CULTURE = 'CULTURE',
  GASTRONOMY = 'GASTRONOMY',
  TECHNOLOGY = 'TECHNOLOGY',
  BUSINESS = 'BUSINESS',
}

export enum MediaType {
  BLOG = 'BLOG',
  VLOG = 'VLOG',
  PODCAST = 'PODCAST',
}

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface ArticleProps {
  id: UUID;
  authorId: UUID;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: ArticleCategory;
  mediaType: MediaType;
  tags: string[];
  coverImageUrl?: string;
  videoUrl?: string;
  status: ArticleStatus;
  publishedAt: Date | null;
  createdAt: Date;
}

export class Article {
  readonly id: UUID;
  readonly authorId: UUID;
  readonly title: string;
  readonly slug: string;
  readonly content: string;
  readonly excerpt: string;
  readonly category: ArticleCategory;
  readonly mediaType: MediaType;
  readonly tags: string[];
  readonly coverImageUrl?: string;
  readonly videoUrl?: string;
  readonly status: ArticleStatus;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;

  private constructor(props: ArticleProps) {
    this.id = props.id;
    this.authorId = props.authorId;
    this.title = props.title;
    this.slug = props.slug;
    this.content = props.content;
    this.excerpt = props.excerpt;
    this.category = props.category;
    this.mediaType = props.mediaType;
    this.tags = props.tags;
    this.coverImageUrl = props.coverImageUrl;
    this.videoUrl = props.videoUrl;
    this.status = props.status;
    this.publishedAt = props.publishedAt;
    this.createdAt = props.createdAt;
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  public static create(props: {
    authorId: UUID;
    title: string;
    content: string;
    excerpt: string;
    category: ArticleCategory;
    mediaType: MediaType;
    tags?: string[];
    coverImageUrl?: string;
    videoUrl?: string;
  }): Result<Article, Error> {
    if (props.title.length < 5) {
      return err(new Error('Article title must be at least 5 characters'));
    }

    const article = new Article({
      id: uuidv4(),
      authorId: props.authorId,
      title: props.title,
      slug: Article.generateSlug(props.title),
      content: props.content,
      excerpt: props.excerpt,
      category: props.category,
      mediaType: props.mediaType,
      tags: props.tags || [],
      coverImageUrl: props.coverImageUrl,
      videoUrl: props.videoUrl,
      status: 'draft',
      publishedAt: null,
      createdAt: new Date(),
    });

    return ok(article);
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      authorId: this.authorId,
      title: this.title,
      slug: this.slug,
      content: this.content,
      excerpt: this.excerpt,
      category: this.category,
      mediaType: this.mediaType,
      tags: this.tags,
      coverImageUrl: this.coverImageUrl,
      videoUrl: this.videoUrl,
      status: this.status,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Article {
    return new Article({
      id: props.id,
      authorId: props.authorId,
      title: props.title,
      slug: props.slug,
      content: props.content,
      excerpt: props.excerpt,
      category: props.category,
      mediaType: props.mediaType,
      tags: props.tags || [],
      coverImageUrl: props.coverImageUrl,
      videoUrl: props.videoUrl,
      status: props.status,
      publishedAt: props.publishedAt ? new Date(props.publishedAt) : null,
      createdAt: new Date(props.createdAt),
    });
  }

  public publish(): Result<void, Error> {
    if (this.status === 'published') {
      return err(new Error('Article is already published'));
    }
    if (this.status === 'archived') {
      return err(new Error('Cannot publish an archived article'));
    }
    (this as any).status = 'published';
    (this as any).publishedAt = new Date();
    return ok(undefined);
  }

  public archive(): Result<void, Error> {
    if (this.status === 'archived') {
      return err(new Error('Article is already archived'));
    }
    if (this.status === 'draft') {
      return err(new Error('Cannot archive a draft article, publish it first'));
    }
    (this as any).status = 'archived';
    return ok(undefined);
  }
}
