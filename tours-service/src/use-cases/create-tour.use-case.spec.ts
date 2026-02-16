import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { CreateTourUseCase } from '@going-monorepo-clean/domains-tour-application';
import { ITourRepository, TourCategory } from '@going-monorepo-clean/domains-tour-core';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByHostId: jest.fn(), searchPublished: jest.fn() };

describe('CreateTourUseCase', () => {
  let useCase: CreateTourUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTourUseCase,
        { provide: ITourRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(CreateTourUseCase);
  });

  const dto = {
    hostId: 'host-1',
    title: 'Tour gastronómico por Quito',
    description: 'Recorrido por mercados',
    location: { address: 'Centro Histórico', city: 'Quito', country: 'Ecuador', latitude: -0.22, longitude: -78.51 },
    price: { amount: 12000, currency: 'USD' as const },
    durationHours: 3,
    maxGuests: 15,
    category: TourCategory.GASTRONOMY,
  };

  it('should create tour successfully', async () => {
    mockRepo.save.mockResolvedValue(ok(undefined));
    const result = await useCase.execute(dto);
    expect(result).toHaveProperty('id');
  });

  it('should throw when save fails', async () => {
    mockRepo.save.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw on invalid location', async () => {
    await expect(useCase.execute({ ...dto, location: { ...dto.location, latitude: 999 } })).rejects.toThrow(InternalServerErrorException);
  });
});
