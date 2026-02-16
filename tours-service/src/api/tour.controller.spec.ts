import { TourController } from './tour.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockGetByIdUseCase = { execute: jest.fn() };
const mockSearchUseCase = { execute: jest.fn() };

describe('TourController', () => {
  let controller: TourController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new TourController(
      mockCreateUseCase as any,
      mockGetByIdUseCase as any,
      mockSearchUseCase as any,
    );
  });

  it('should create tour', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'tour-1' });
    const result = await controller.create({} as any);
    expect(result).toEqual({ id: 'tour-1' });
    expect(mockCreateUseCase.execute).toHaveBeenCalled();
  });

  it('should search tours', async () => {
    mockSearchUseCase.execute.mockResolvedValue([{ title: 'City Tour' }]);
    const result = await controller.search({ locationCity: 'Quito' } as any);
    expect(result).toHaveLength(1);
    expect(mockSearchUseCase.execute).toHaveBeenCalledWith({ locationCity: 'Quito' });
  });

  it('should get tour by id', async () => {
    const mockTour = { toPrimitives: () => ({ id: 'tour-1', title: 'City Tour' }) };
    mockGetByIdUseCase.execute.mockResolvedValue(mockTour);
    const result = await controller.getById('tour-1');
    expect(result).toEqual({ id: 'tour-1', title: 'City Tour' });
    expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('tour-1');
  });
});
