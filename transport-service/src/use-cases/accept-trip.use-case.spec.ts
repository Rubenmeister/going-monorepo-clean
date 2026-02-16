import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { AcceptTripUseCase } from '@going-monorepo-clean/domains-transport-application';
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

const createPendingTrip = (): Trip => {
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

  return Trip.create({
    userId: 'user-123',
    origin,
    destination,
    price: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
  })._unsafeUnwrap();
};

describe('AcceptTripUseCase', () => {
  let useCase: AcceptTripUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptTripUseCase,
        { provide: ITripRepository, useValue: mockTripRepository },
      ],
    }).compile();

    useCase = module.get<AcceptTripUseCase>(AcceptTripUseCase);
  });

  it('should accept a pending trip successfully', async () => {
    const trip = createPendingTrip();
    mockTripRepository.findById.mockResolvedValue(ok(trip));
    mockTripRepository.update.mockResolvedValue(ok(undefined));

    await useCase.execute(trip.id, 'driver-456');

    expect(mockTripRepository.update).toHaveBeenCalledTimes(1);
    const updatedTrip = mockTripRepository.update.mock.calls[0][0];
    expect(updatedTrip.status).toBe('driver_assigned');
    expect(updatedTrip.driverId).toBe('driver-456');
  });

  it('should throw NotFoundException when trip not found', async () => {
    mockTripRepository.findById.mockResolvedValue(ok(null));

    await expect(
      useCase.execute('nonexistent-trip', 'driver-456'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw PreconditionFailedException when trip is not pending', async () => {
    const trip = createPendingTrip();
    trip.assignDriver('other-driver'); // status = 'driver_assigned'

    mockTripRepository.findById.mockResolvedValue(ok(trip));

    await expect(
      useCase.execute(trip.id, 'driver-456'),
    ).rejects.toThrow(PreconditionFailedException);
  });

  it('should throw when repository findById fails', async () => {
    mockTripRepository.findById.mockResolvedValue(
      err(new Error('Database error')),
    );

    await expect(
      useCase.execute('trip-id', 'driver-id'),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw when repository update fails', async () => {
    const trip = createPendingTrip();
    mockTripRepository.findById.mockResolvedValue(ok(trip));
    mockTripRepository.update.mockResolvedValue(
      err(new Error('Database write error')),
    );

    await expect(
      useCase.execute(trip.id, 'driver-456'),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
