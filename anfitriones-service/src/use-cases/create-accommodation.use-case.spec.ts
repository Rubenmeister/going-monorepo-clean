import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { CreateAccommodationUseCase } from '@going-monorepo-clean/domains-accommodation-application';
import { IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByHostId: jest.fn(), search: jest.fn() };

describe('CreateAccommodationUseCase', () => {
  let useCase: CreateAccommodationUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAccommodationUseCase,
        { provide: IAccommodationRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(CreateAccommodationUseCase);
  });

  const dto = {
    hostId: 'host-1',
    title: 'Casa en la playa',
    description: 'Hermosa casa frente al mar',
    location: { address: 'Calle Larga', city: 'Cuenca', country: 'Ecuador', latitude: -2.9, longitude: -79.0 },
    pricePerNight: { amount: 8000, currency: 'USD' as const },
    capacity: 4,
    amenities: ['wifi'],
  };

  it('should create accommodation successfully', async () => {
    mockRepo.save.mockResolvedValue(ok(undefined));
    const result = await useCase.execute(dto);
    expect(result).toHaveProperty('id');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw when save fails', async () => {
    mockRepo.save.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw when entity creation fails (short title)', async () => {
    await expect(useCase.execute({ ...dto, title: 'Hi' })).rejects.toThrow(InternalServerErrorException);
  });
});
