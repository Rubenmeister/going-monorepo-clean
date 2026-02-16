import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { FindParcelsByUserUseCase } from '@going-monorepo-clean/domains-parcel-application';
import { Parcel, IParcelRepository } from '@going-monorepo-clean/domains-parcel-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByUserId: jest.fn(), findByDriverId: jest.fn() };

describe('FindParcelsByUserUseCase', () => {
  let useCase: FindParcelsByUserUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindParcelsByUserUseCase,
        { provide: IParcelRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(FindParcelsByUserUseCase);
  });

  it('should return mapped parcels', async () => {
    const parcel = Parcel.create({
      userId: 'user-1',
      origin: Location.create({ address: 'Origen', city: 'Quito', country: 'Ecuador', latitude: -0.18, longitude: -78.46 })._unsafeUnwrap(),
      destination: Location.create({ address: 'Destino', city: 'Quito', country: 'Ecuador', latitude: -0.19, longitude: -78.48 })._unsafeUnwrap(),
      description: 'Paquete',
      price: Money.fromPrimitives({ amount: 1500, currency: 'USD' }),
    })._unsafeUnwrap();
    mockRepo.findByUserId.mockResolvedValue(ok([parcel]));
    const results = await useCase.execute('user-1');
    expect(results).toHaveLength(1);
    expect(results[0].originAddress).toBe('Origen');
    expect(results[0].price).toBe(1500);
  });

  it('should return empty array', async () => {
    mockRepo.findByUserId.mockResolvedValue(ok([]));
    const results = await useCase.execute('user-empty');
    expect(results).toEqual([]);
  });

  it('should throw on error', async () => {
    mockRepo.findByUserId.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute('user-1')).rejects.toThrow(InternalServerErrorException);
  });
});
