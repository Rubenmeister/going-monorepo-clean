import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { GetActiveDriversUseCase } from '@going-monorepo-clean/domains-tracking-application';
import { ITrackingRepository, DriverLocation, Location } from '@going-monorepo-clean/domains-tracking-core';

const mockRepo = { save: jest.fn(), findByDriverId: jest.fn(), findAllActive: jest.fn() };

describe('GetActiveDriversUseCase', () => {
  let useCase: GetActiveDriversUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActiveDriversUseCase,
        { provide: ITrackingRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(GetActiveDriversUseCase);
  });

  it('should return active driver locations', async () => {
    const loc = DriverLocation.create({
      driverId: 'driver-1',
      location: Location.create({ latitude: -0.18, longitude: -78.46 })._unsafeUnwrap(),
    });
    mockRepo.findAllActive.mockResolvedValue(ok([loc]));
    const results = await useCase.execute();
    expect(results).toHaveLength(1);
    expect(results[0].driverId).toBe('driver-1');
    expect(results[0].latitude).toBe(-0.18);
  });

  it('should return empty when no active drivers', async () => {
    mockRepo.findAllActive.mockResolvedValue(ok([]));
    const results = await useCase.execute();
    expect(results).toEqual([]);
  });

  it('should throw on repository error', async () => {
    mockRepo.findAllActive.mockResolvedValue(err(new Error('Redis error')));
    await expect(useCase.execute()).rejects.toThrow(InternalServerErrorException);
  });
});
