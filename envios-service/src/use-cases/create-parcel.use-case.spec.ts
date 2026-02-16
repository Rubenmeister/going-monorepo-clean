import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { CreateParcelUseCase } from '@going-monorepo-clean/domains-parcel-application';
import { IParcelRepository } from '@going-monorepo-clean/domains-parcel-core';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByUserId: jest.fn(), findByDriverId: jest.fn() };

describe('CreateParcelUseCase', () => {
  let useCase: CreateParcelUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateParcelUseCase,
        { provide: IParcelRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(CreateParcelUseCase);
  });

  const dto = {
    userId: 'user-1',
    origin: { address: 'Av. Amazonas', city: 'Quito', country: 'Ecuador', latitude: -0.18, longitude: -78.46 },
    destination: { address: 'Av. 6 de Diciembre', city: 'Quito', country: 'Ecuador', latitude: -0.19, longitude: -78.48 },
    description: 'Paquete frágil',
    price: { amount: 2000, currency: 'USD' as const },
  };

  it('should create parcel successfully', async () => {
    mockRepo.save.mockResolvedValue(ok(undefined));
    const result = await useCase.execute(dto);
    expect(result).toHaveProperty('id');
  });

  it('should throw when save fails', async () => {
    mockRepo.save.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw on invalid origin location', async () => {
    await expect(useCase.execute({ ...dto, origin: { ...dto.origin, latitude: 999 } })).rejects.toThrow(InternalServerErrorException);
  });
});
