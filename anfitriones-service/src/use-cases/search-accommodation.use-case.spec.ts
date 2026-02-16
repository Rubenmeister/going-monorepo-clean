import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { SearchAccommodationUseCase } from '@going-monorepo-clean/domains-accommodation-application';
import { Accommodation, IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByHostId: jest.fn(), search: jest.fn() };

describe('SearchAccommodationUseCase', () => {
  let useCase: SearchAccommodationUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchAccommodationUseCase,
        { provide: IAccommodationRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(SearchAccommodationUseCase);
  });

  it('should return mapped results', async () => {
    const acc = Accommodation.create({
      hostId: 'host-1',
      title: 'Casa bonita',
      description: 'Desc',
      location: Location.create({ address: 'Calle', city: 'Cuenca', country: 'Ecuador', latitude: -2.9, longitude: -79.0 })._unsafeUnwrap(),
      pricePerNight: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
      capacity: 3,
    })._unsafeUnwrap();
    mockRepo.search.mockResolvedValue(ok([acc]));
    const results = await useCase.execute({ city: 'Cuenca' });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Casa bonita');
    expect(results[0].city).toBe('Cuenca');
    expect(results[0].price).toBe(5000);
  });

  it('should return empty array when no results', async () => {
    mockRepo.search.mockResolvedValue(ok([]));
    const results = await useCase.execute({ city: 'Empty' });
    expect(results).toEqual([]);
  });

  it('should throw on repository error', async () => {
    mockRepo.search.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute({ city: 'Cuenca' })).rejects.toThrow(InternalServerErrorException);
  });
});
