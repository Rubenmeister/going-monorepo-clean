import { ArticleController } from './article.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockGetByIdUseCase = { execute: jest.fn() };
const mockGetBySlugUseCase = { execute: jest.fn() };
const mockSearchUseCase = { execute: jest.fn() };
const mockPublishUseCase = { execute: jest.fn() };

describe('ArticleController', () => {
  let controller: ArticleController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new ArticleController(
      mockCreateUseCase as any,
      mockGetByIdUseCase as any,
      mockGetBySlugUseCase as any,
      mockSearchUseCase as any,
      mockPublishUseCase as any,
    );
  });

  it('should create an article', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'article-1' });
    const result = await controller.create({} as any);
    expect(result).toEqual({ id: 'article-1' });
    expect(mockCreateUseCase.execute).toHaveBeenCalled();
  });

  it('should search articles', async () => {
    mockSearchUseCase.execute.mockResolvedValue([{ title: 'Ecuador Travel' }]);
    const result = await controller.search({ category: 'TRAVEL' } as any);
    expect(result).toHaveLength(1);
    expect(mockSearchUseCase.execute).toHaveBeenCalledWith({ category: 'TRAVEL' });
  });

  it('should get article by slug', async () => {
    const mockArticle = { toPrimitives: () => ({ id: 'a-1', slug: 'ecuador-travel' }) };
    mockGetBySlugUseCase.execute.mockResolvedValue(mockArticle);
    const result = await controller.getBySlug('ecuador-travel');
    expect(result).toEqual({ id: 'a-1', slug: 'ecuador-travel' });
    expect(mockGetBySlugUseCase.execute).toHaveBeenCalledWith('ecuador-travel');
  });

  it('should get article by id', async () => {
    const mockArticle = { toPrimitives: () => ({ id: 'a-1', title: 'Ecuador' }) };
    mockGetByIdUseCase.execute.mockResolvedValue(mockArticle);
    const result = await controller.getById('a-1');
    expect(result).toEqual({ id: 'a-1', title: 'Ecuador' });
    expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('a-1');
  });

  it('should publish an article', async () => {
    mockPublishUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.publish('a-1');
    expect(result).toEqual({ message: 'Article published successfully' });
    expect(mockPublishUseCase.execute).toHaveBeenCalledWith('a-1');
  });
});
