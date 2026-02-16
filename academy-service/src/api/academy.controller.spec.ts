import { AcademyController } from './academy.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockGetByIdUseCase = { execute: jest.fn() };
const mockSearchUseCase = { execute: jest.fn() };
const mockPublishUseCase = { execute: jest.fn() };

describe('AcademyController', () => {
  let controller: AcademyController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new AcademyController(
      mockCreateUseCase as any,
      mockGetByIdUseCase as any,
      mockSearchUseCase as any,
      mockPublishUseCase as any,
    );
  });

  it('should create a course', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'course-1' });
    const result = await controller.create({} as any);
    expect(result).toEqual({ id: 'course-1' });
    expect(mockCreateUseCase.execute).toHaveBeenCalled();
  });

  it('should search courses', async () => {
    mockSearchUseCase.execute.mockResolvedValue([{ title: 'TypeScript' }]);
    const result = await controller.search({ category: 'TECHNOLOGY' } as any);
    expect(result).toHaveLength(1);
    expect(mockSearchUseCase.execute).toHaveBeenCalledWith({ category: 'TECHNOLOGY' });
  });

  it('should get course by id', async () => {
    const mockCourse = { toPrimitives: () => ({ id: 'course-1', title: 'TypeScript' }) };
    mockGetByIdUseCase.execute.mockResolvedValue(mockCourse);
    const result = await controller.getById('course-1');
    expect(result).toEqual({ id: 'course-1', title: 'TypeScript' });
    expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('course-1');
  });

  it('should publish a course', async () => {
    mockPublishUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.publish('course-1');
    expect(result).toEqual({ message: 'Curso publicado exitosamente' });
    expect(mockPublishUseCase.execute).toHaveBeenCalledWith('course-1');
  });
});
