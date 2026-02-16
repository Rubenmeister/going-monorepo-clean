import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { RequestTripUseCase } from '@going-monorepo-clean/domains-transport-application';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { IEventBus } from '@going-monorepo-clean/shared-domain';

const mockTripRepository = {
  save: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findActiveTripsByDriver: jest.fn(),
  findTripsByUser: jest.fn(),
  findPendingTrips: jest.fn(),
};

const mockEventBus = {
  publish: jest.fn(),
  publishAll: jest.fn(),
};

describe('RequestTripUseCase', () => {
  let useCase: RequestTripUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestTripUseCase,
        { provide: ITripRepository, useValue: mockTripRepository },
        { provide: IEventBus, useValue: mockEventBus },
      ],
    }).compile();

    useCase = module.get<RequestTripUseCase>(RequestTripUseCase);
  });

  const validDto = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    origin: {
      address: 'Av. Amazonas N36-152',
      city: 'Quito',
      country: 'Ecuador',
      latitude: -0.1807,
      longitude: -78.4678,
    },
    destination: {
      address: 'Av. 6 de Diciembre',
      city: 'Quito',
      country: 'Ecuador',
      latitude: -0.1900,
      longitude: -78.4800,
    },
    price: { amount: 5000, currency: 'USD' as const },
  };

  it('should create a trip request successfully', async () => {
    mockTripRepository.save.mockResolvedValue(ok(undefined));
    mockEventBus.publish.mockResolvedValue(undefined);

    const result = await useCase.execute(validDto);

    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('string');
    expect(mockTripRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('should still succeed if event publishing fails', async () => {
    mockTripRepository.save.mockResolvedValue(ok(undefined));
    mockEventBus.publish.mockRejectedValue(new Error('Event bus down'));

    const result = await useCase.execute(validDto);

    expect(result).toHaveProperty('id');
    expect(mockTripRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when repository save fails', async () => {
    mockTripRepository.save.mockResolvedValue(
      err(new Error('Database error')),
    );

    await expect(useCase.execute(validDto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should throw when origin location is invalid', async () => {
    const invalidDto = {
      ...validDto,
      origin: { ...validDto.origin, latitude: 999 }, // invalid latitude
    };

    await expect(useCase.execute(invalidDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(mockTripRepository.save).not.toHaveBeenCalled();
  });
});
