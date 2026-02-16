import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { PublishAccommodationUseCase } from '@going-monorepo-clean/domains-accommodation-application';
import { Accommodation, IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByHostId: jest.fn(), search: jest.fn() };

describe('PublishAccommodationUseCase', () => {
  let useCase: PublishAccommodationUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishAccommodationUseCase,
        { provide: IAccommodationRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(PublishAccommodationUseCase);
  });

  const createAccommodation = () =>
    Accommodation.create({
      hostId: 'host-1',
      title: 'Casa bonita',
      description: 'Desc',
      location: Location.create({ address: 'Calle', city: 'Cuenca', country: 'Ecuador', latitude: -2.9, longitude: -79.0 })._unsafeUnwrap(),
      pricePerNight: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
      capacity: 2,
    })._unsafeUnwrap();

  it('should publish a draft accommodation', async () => {
    const acc = createAccommodation();
    mockRepo.findById.mockResolvedValue(ok(acc));
    mockRepo.update.mockResolvedValue(ok(undefined));
    await useCase.execute('acc-1');
    expect(acc.status).toBe('published');
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('should throw NotFoundException when not found', async () => {
    mockRepo.findById.mockResolvedValue(ok(null));
    await expect(useCase.execute('not-exist')).rejects.toThrow(NotFoundException);
  });

  it('should throw on repository error', async () => {
    mockRepo.findById.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute('acc-1')).rejects.toThrow(InternalServerErrorException);
  });
});
