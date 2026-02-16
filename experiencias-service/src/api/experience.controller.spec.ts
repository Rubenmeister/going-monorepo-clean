import { ExperienceController } from './experience.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockGetByIdUseCase = { execute: jest.fn() };
const mockSearchUseCase = { execute: jest.fn() };

describe('ExperienceController', () => {
  let controller: ExperienceController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new ExperienceController(
      mockCreateUseCase as any,
      mockGetByIdUseCase as any,
      mockSearchUseCase as any,
    );
  });

  it('should create experience', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'exp-1' });
    const result = await controller.createExperience({} as any);
    expect(result).toEqual({ id: 'exp-1' });
    expect(mockCreateUseCase.execute).toHaveBeenCalled();
  });

  it('should search experiences', async () => {
    mockSearchUseCase.execute.mockResolvedValue([{ title: 'Hiking' }]);
    const result = await controller.search({ locationCity: 'Quito' } as any);
    expect(result).toHaveLength(1);
    expect(mockSearchUseCase.execute).toHaveBeenCalledWith({ locationCity: 'Quito' });
  });

  it('should get experience by id', async () => {
    const mockExp = { toPrimitives: () => ({ id: 'exp-1', title: 'Hiking' }) };
    mockGetByIdUseCase.execute.mockResolvedValue(mockExp);
    const result = await controller.getById('exp-1');
    expect(result).toEqual({ id: 'exp-1', title: 'Hiking' });
    expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('exp-1');
  });
});
