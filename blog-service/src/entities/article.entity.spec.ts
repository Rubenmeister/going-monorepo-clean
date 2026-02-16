import { Article, ArticleCategory, MediaType } from '@going-monorepo-clean/domains-blog-core';

describe('Article Entity', () => {
  const validProps = {
    authorId: 'author-1',
    title: 'Descubriendo Ecuador: Guía Completa',
    content: 'Ecuador es un país de contrastes...',
    excerpt: 'Una guía completa para explorar Ecuador',
    category: ArticleCategory.TRAVEL,
    mediaType: MediaType.BLOG,
    tags: ['ecuador', 'travel', 'guide'],
  };

  it('should create an article in draft status with auto-generated slug', () => {
    const result = Article.create(validProps);
    expect(result.isOk()).toBe(true);
    const article = result._unsafeUnwrap();
    expect(article.status).toBe('draft');
    expect(article.slug).toBe('descubriendo-ecuador-gu-a-completa');
    expect(article.publishedAt).toBeNull();
    expect(article.tags).toEqual(['ecuador', 'travel', 'guide']);
  });

  it('should reject title shorter than 5 chars', () => {
    const result = Article.create({ ...validProps, title: 'AB' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('at least 5');
  });

  it('should default tags to empty array', () => {
    const result = Article.create({ ...validProps, tags: undefined });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().tags).toEqual([]);
  });

  it('should publish a draft article and set publishedAt', () => {
    const article = Article.create(validProps)._unsafeUnwrap();
    expect(article.publishedAt).toBeNull();
    const result = article.publish();
    expect(result.isOk()).toBe(true);
    expect(article.status).toBe('published');
    expect(article.publishedAt).toBeInstanceOf(Date);
  });

  it('should not publish an already published article', () => {
    const article = Article.create(validProps)._unsafeUnwrap();
    article.publish();
    const result = article.publish();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('already published');
  });

  it('should not publish an archived article', () => {
    const article = Article.create(validProps)._unsafeUnwrap();
    article.publish();
    article.archive();
    const result = article.publish();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('archived');
  });

  it('should archive a published article', () => {
    const article = Article.create(validProps)._unsafeUnwrap();
    article.publish();
    const result = article.archive();
    expect(result.isOk()).toBe(true);
    expect(article.status).toBe('archived');
  });

  it('should not archive a draft article', () => {
    const article = Article.create(validProps)._unsafeUnwrap();
    const result = article.archive();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('draft');
  });

  it('should serialize to primitives and back', () => {
    const article = Article.create(validProps)._unsafeUnwrap();
    const primitives = article.toPrimitives();
    const restored = Article.fromPrimitives(primitives);
    expect(restored.id).toBe(article.id);
    expect(restored.title).toBe(article.title);
    expect(restored.slug).toBe(article.slug);
    expect(restored.status).toBe('draft');
  });

  it('should support VLOG media type with videoUrl', () => {
    const result = Article.create({
      ...validProps,
      mediaType: MediaType.VLOG,
      videoUrl: 'https://youtube.com/watch?v=abc123',
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().mediaType).toBe(MediaType.VLOG);
    expect(result._unsafeUnwrap().videoUrl).toBe('https://youtube.com/watch?v=abc123');
  });
});
