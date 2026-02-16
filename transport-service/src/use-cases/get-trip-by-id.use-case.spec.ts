import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { GetTripByIdUseCase } from '@going-monorepo-clean/domains-transport-application';
import { Trip, ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findActiveTripsByDriver: jest.fn(), findTripsByUser: jest.fn(), findPendingTrips: jest.fn() };

describe('GetTripByIdUseCase', () => {
  let useCase: GetTripByIdUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTripByIdUseCase,
        { provide: ITripRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(GetTripByIdUseCase);
  });

  const fakeTrip = Trip.create({
    userId: 'user-1',
    origin: Location.create({ address: 'Origen', city: 'Quito', country: 'Ecuador', latitude: -0.18, longitude: -78.46 })._unsafeUnwrap(),
    destination: Location.create({ address: 'Destino', city: 'Quito', country: 'Ecuador', latitude: -0.19, longitude: -78.48 })._unsafeUnwrap(),
    price: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
  })._unsafeUnwrap();

  it('should return trip when found', async () => {
    mockRepo.findById.mockResolvedValue(ok(fakeTrip));
    const result = await useCase.execute('trip-1');
    expect(result.userId).toBe('user-1');
  });

  it('should throw NotFoundException when not found', async () => {
    mockRepo.findById.mockResolvedValue(ok(null));
    await expect(useCase.execute('not-exist')).rejects.toThrow(NotFoundException);
  });

  it('should throw on repository error', async () => {
    mockRepo.findById.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute('trip-1')).rejects.toThrow(InternalServerErrorException);
  });
});
