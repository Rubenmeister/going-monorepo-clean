import { AccommodationController } from './accommodation.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockSearchUseCase = { execute: jest.fn() };

describe('AccommodationController', () => {
  let controller: AccommodationController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new AccommodationController(
      mockCreateUseCase as any,
      mockSearchUseCase as any,
    );
  });

  it('should create accommodation', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'acc-1' });
    const result = await controller.createAccommodation({} as any);
    expect(result).toEqual({ id: 'acc-1' });
    expect(mockCreateUseCase.execute).toHaveBeenCalled();
  });

  it('should search accommodations', async () => {
    mockSearchUseCase.execute.mockResolvedValue([{ title: 'Casa' }]);
    const result = await controller.searchAccommodations({ city: 'Cuenca' } as any);
    expect(result).toHaveLength(1);
    expect(mockSearchUseCase.execute).toHaveBeenCalledWith({ city: 'Cuenca' });
  });
});
