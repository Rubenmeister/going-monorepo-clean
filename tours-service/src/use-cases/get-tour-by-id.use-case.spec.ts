import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { GetTourByIdUseCase } from '@going-monorepo-clean/domains-tour-application';
import { Tour, ITourRepository, TourCategory } from '@going-monorepo-clean/domains-tour-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByHostId: jest.fn(), searchPublished: jest.fn() };

describe('GetTourByIdUseCase', () => {
  let useCase: GetTourByIdUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTourByIdUseCase,
        { provide: ITourRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(GetTourByIdUseCase);
  });

  const fakeTour = Tour.create({
    hostId: 'host-1',
    title: 'Tour cultural',
    description: 'Recorrido',
    location: Location.create({ address: 'Centro', city: 'Quito', country: 'Ecuador', latitude: -0.22, longitude: -78.51 })._unsafeUnwrap(),
    price: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
    durationHours: 2,
    maxGuests: 10,
    category: TourCategory.CULTURAL,
  })._unsafeUnwrap();

  it('should return tour when found', async () => {
    mockRepo.findById.mockResolvedValue(ok(fakeTour));
    const result = await useCase.execute('tour-1');
    expect(result.title).toBe('Tour cultural');
  });

  it('should throw NotFoundException when not found', async () => {
    mockRepo.findById.mockResolvedValue(ok(null));
    await expect(useCase.execute('not-exist')).rejects.toThrow(NotFoundException);
  });

  it('should throw on repository error', async () => {
    mockRepo.findById.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute('tour-1')).rejects.toThrow(InternalServerErrorException);
  });
});
