import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { CreateBookingUseCase, CreateBookingDto } from '@going-monorepo-clean/domains-booking-application';
import { IBookingRepository } from '@going-monorepo-clean/domains-booking-core';

const mockBookingRepository = {
  save: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByServiceId: jest.fn(),
};

describe('CreateBookingUseCase', () => {
  let useCase: CreateBookingUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBookingUseCase,
        { provide: IBookingRepository, useValue: mockBookingRepository },
      ],
    }).compile();

    useCase = module.get<CreateBookingUseCase>(CreateBookingUseCase);
  });

  const validDto = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    serviceId: '660e8400-e29b-41d4-a716-446655440001',
    serviceType: 'accommodation',
    totalPrice: { amount: 15000, currency: 'USD' },
    startDate: new Date('2025-03-15'),
    endDate: new Date('2025-03-20'),
  } as unknown as CreateBookingDto;

  it('should create a booking successfully', async () => {
    mockBookingRepository.save.mockResolvedValue(ok(undefined));

    const result = await useCase.execute(validDto);

    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('string');
    expect(mockBookingRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when repository save fails', async () => {
    mockBookingRepository.save.mockResolvedValue(
      err(new Error('Database connection lost')),
    );

    await expect(useCase.execute(validDto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should throw when total price is not positive', async () => {
    const invalidDto = {
      ...validDto,
      totalPrice: { amount: 0, currency: 'USD' },
    } as unknown as CreateBookingDto;

    await expect(useCase.execute(invalidDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(mockBookingRepository.save).not.toHaveBeenCalled();
  });
});
