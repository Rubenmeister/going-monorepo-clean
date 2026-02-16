import { ExperienceController } from './experience.controller';

const mockCreateUseCase = { execute: jest.fn() };

describe('ExperienceController', () => {
  let controller: ExperienceController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new ExperienceController(mockCreateUseCase as any);
  });

  it('should create experience', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'exp-1' });
    const result = await controller.createExperience({} as any);
    expect(result).toEqual({ id: 'exp-1' });
    expect(mockCreateUseCase.execute).toHaveBeenCalled();
  });
});
