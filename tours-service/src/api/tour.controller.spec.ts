import { TourController } from './tour.controller';

const mockCreateUseCase = { execute: jest.fn() };

describe('TourController', () => {
  let controller: TourController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new TourController(mockCreateUseCase as any);
  });

  it('should create tour', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'tour-1' });
    const result = await controller.create({} as any);
    expect(result).toEqual({ id: 'tour-1' });
    expect(mockCreateUseCase.execute).toHaveBeenCalled();
  });
});
