import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { GetActiveTripByUserUseCase } from '@going-monorepo-clean/domains-transport-application';
import { Trip, ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

const mockTripRepository = {
  save: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findActiveTripsByDriver: jest.fn(),
  findTripsByUser: jest.fn(),
  findPendingTrips: jest.fn(),
};

const createTrip = (status: string): Trip => {
  const origin = Location.create({
    address: 'Av. Amazonas',
    city: 'Quito',
    country: 'Ecuador',
    latitude: -0.18,
    longitude: -78.46,
  })._unsafeUnwrap();
  const destination = Location.create({
    address: 'Av. 6 de Diciembre',
    city: 'Quito',
    country: 'Ecuador',
    latitude: -0.19,
    longitude: -78.48,
  })._unsafeUnwrap();

  const trip = Trip.create({
    userId: 'user-123',
    origin,
    destination,
    price: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
  })._unsafeUnwrap();

  // Simulate status transitions
  if (status === 'driver_assigned' || status === 'in_progress' || status === 'completed') {
    trip.assignDriver('driver-1');
  }
  if (status === 'in_progress' || status === 'completed') {
    trip.startTrip();
  }
  if (status === 'completed') {
    trip.completeTrip();
  }
  if (status === 'cancelled') {
    trip.cancel();
  }

  return trip;
};

describe('GetActiveTripByUserUseCase', () => {
  let useCase: GetActiveTripByUserUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActiveTripByUserUseCase,
        { provide: ITripRepository, useValue: mockTripRepository },
      ],
    }).compile();

    useCase = module.get<GetActiveTripByUserUseCase>(GetActiveTripByUserUseCase);
  });

  it('should return a pending trip as active', async () => {
    const pendingTrip = createTrip('pending');
    mockTripRepository.findTripsByUser.mockResolvedValue(ok([pendingTrip]));

    const result = await useCase.execute('user-123');

    expect(result).not.toBeNull();
    expect(result!.status).toBe('pending');
  });

  it('should return a driver_assigned trip as active', async () => {
    const assignedTrip = createTrip('driver_assigned');
    mockTripRepository.findTripsByUser.mockResolvedValue(ok([assignedTrip]));

    const result = await useCase.execute('user-123');

    expect(result).not.toBeNull();
    expect(result!.status).toBe('driver_assigned');
  });

  it('should return an in_progress trip as active', async () => {
    const inProgressTrip = createTrip('in_progress');
    mockTripRepository.findTripsByUser.mockResolvedValue(ok([inProgressTrip]));

    const result = await useCase.execute('user-123');

    expect(result).not.toBeNull();
    expect(result!.status).toBe('in_progress');
  });

  it('should return null when all trips are completed or cancelled', async () => {
    const completedTrip = createTrip('completed');
    const cancelledTrip = createTrip('cancelled');
    mockTripRepository.findTripsByUser.mockResolvedValue(
      ok([completedTrip, cancelledTrip]),
    );

    const result = await useCase.execute('user-123');

    expect(result).toBeNull();
  });

  it('should return null when user has no trips', async () => {
    mockTripRepository.findTripsByUser.mockResolvedValue(ok([]));

    const result = await useCase.execute('user-no-trips');

    expect(result).toBeNull();
  });

  it('should throw when repository fails', async () => {
    mockTripRepository.findTripsByUser.mockResolvedValue(
      err(new Error('Database error')),
    );

    await expect(useCase.execute('user-123')).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
