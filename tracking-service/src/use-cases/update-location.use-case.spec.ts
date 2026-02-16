import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { UpdateLocationUseCase } from '@going-monorepo-clean/domains-tracking-application';
import { ITrackingRepository, ITrackingGateway } from '@going-monorepo-clean/domains-tracking-core';

const mockRepo = { save: jest.fn(), findByDriverId: jest.fn(), findAllActive: jest.fn() };
const mockGateway = { broadcastLocationUpdate: jest.fn(), broadcastToRoom: jest.fn() };

describe('UpdateLocationUseCase', () => {
  let useCase: UpdateLocationUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateLocationUseCase,
        { provide: ITrackingRepository, useValue: mockRepo },
        { provide: ITrackingGateway, useValue: mockGateway },
      ],
    }).compile();
    useCase = module.get(UpdateLocationUseCase);
  });

  const dto = { driverId: 'driver-1', latitude: -0.18, longitude: -78.46 };

  it('should update location successfully', async () => {
    mockRepo.save.mockResolvedValue(ok(undefined));
    mockGateway.broadcastLocationUpdate.mockResolvedValue(ok(undefined));
    await useCase.execute(dto);
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockGateway.broadcastLocationUpdate).toHaveBeenCalled();
  });

  it('should throw on invalid latitude', async () => {
    await expect(useCase.execute({ ...dto, latitude: 999 })).rejects.toThrow(BadRequestException);
  });

  it('should throw when repository save fails', async () => {
    mockRepo.save.mockResolvedValue(err(new Error('Redis error')));
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });

  it('should tolerate broadcast failure', async () => {
    mockRepo.save.mockResolvedValue(ok(undefined));
    mockGateway.broadcastLocationUpdate.mockResolvedValue(err(new Error('WS down')));
    await expect(useCase.execute(dto)).resolves.toBeUndefined();
  });
});
