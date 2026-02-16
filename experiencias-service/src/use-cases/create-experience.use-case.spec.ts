import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { CreateExperienceUseCase } from '@going-monorepo-clean/domains-experience-application';
import { IExperienceRepository } from '@going-monorepo-clean/domains-experience-core';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByHostId: jest.fn(), searchPublished: jest.fn() };

describe('CreateExperienceUseCase', () => {
  let useCase: CreateExperienceUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateExperienceUseCase,
        { provide: IExperienceRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(CreateExperienceUseCase);
  });

  const dto = {
    hostId: 'host-1',
    title: 'Tour de café ecuatoriano',
    description: 'Recorrido por fincas',
    location: { address: 'Mitad del Mundo', city: 'Quito', country: 'Ecuador', latitude: 0.0, longitude: -78.45 },
    price: { amount: 3500, currency: 'USD' as const },
    durationHours: 4,
  };

  it('should create experience successfully', async () => {
    mockRepo.save.mockResolvedValue(ok(undefined));
    const result = await useCase.execute(dto);
    expect(result).toHaveProperty('id');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw when save fails', async () => {
    mockRepo.save.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw on invalid location', async () => {
    await expect(useCase.execute({ ...dto, location: { ...dto.location, latitude: 999 } })).rejects.toThrow(InternalServerErrorException);
  });
});
