import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { FindBookingsByUserUseCase } from '@going-monorepo-clean/domains-booking-application';
import { Booking, IBookingRepository } from '@going-monorepo-clean/domains-booking-core';
import { Money } from '@going-monorepo-clean/shared-domain';

const mockBookingRepository = {
  save: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByServiceId: jest.fn(),
};

describe('FindBookingsByUserUseCase', () => {
  let useCase: FindBookingsByUserUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindBookingsByUserUseCase,
        { provide: IBookingRepository, useValue: mockBookingRepository },
      ],
    }).compile();

    useCase = module.get<FindBookingsByUserUseCase>(FindBookingsByUserUseCase);
  });

  it('should return bookings for a user', async () => {
    const booking = Booking.create({
      userId: 'user-123',
      serviceId: 'service-456',
      serviceType: 'accommodation' as any,
      totalPrice: Money.fromPrimitives({ amount: 10000, currency: 'USD' }),
      startDate: new Date('2025-03-15'),
    })._unsafeUnwrap();

    mockBookingRepository.findByUserId.mockResolvedValue(ok([booking]));

    const result = await useCase.execute('user-123');

    expect(result).toHaveLength(1);
    expect(result[0].serviceId).toBeDefined();
    expect(result[0].totalPrice).toBe(10000);
    expect(result[0].currency).toBe('USD');
    expect(result[0].status).toBe('pending');
  });

  it('should return empty array when user has no bookings', async () => {
    mockBookingRepository.findByUserId.mockResolvedValue(ok([]));

    const result = await useCase.execute('user-no-bookings');

    expect(result).toEqual([]);
  });

  it('should throw when repository fails', async () => {
    mockBookingRepository.findByUserId.mockResolvedValue(
      err(new Error('Database error')),
    );

    await expect(useCase.execute('user-123')).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
