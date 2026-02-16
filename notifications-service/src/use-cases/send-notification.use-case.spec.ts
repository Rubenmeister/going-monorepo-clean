import { Test, TestingModule } from '@nestjs/testing';
import { ok, err } from 'neverthrow';
import { SendNotificationUseCase } from '@going-monorepo-clean/domains-notification-application';
import { INotificationRepository, INotificationGateway } from '@going-monorepo-clean/domains-notification-core';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findPendingByChannel: jest.fn(), findByUserId: jest.fn() };
const mockGateway = { send: jest.fn() };

describe('SendNotificationUseCase', () => {
  let useCase: SendNotificationUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendNotificationUseCase,
        { provide: INotificationRepository, useValue: mockRepo },
        { provide: INotificationGateway, useValue: mockGateway },
      ],
    }).compile();
    useCase = module.get(SendNotificationUseCase);
  });

  const dto = { userId: 'user-1', channel: 'PUSH' as any, title: 'Test', body: 'Test body' };

  it('should send notification successfully', async () => {
    mockRepo.save.mockResolvedValue(ok(undefined));
    mockGateway.send.mockResolvedValue(ok(undefined));
    mockRepo.update.mockResolvedValue(ok(undefined));
    const result = await useCase.execute(dto);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toHaveProperty('id');
  });

  it('should return error on invalid channel', async () => {
    const result = await useCase.execute({ ...dto, channel: 'INVALID' as any });
    expect(result.isErr()).toBe(true);
  });

  it('should return error when save fails', async () => {
    mockRepo.save.mockResolvedValue(err(new Error('DB error')));
    const result = await useCase.execute(dto);
    expect(result.isErr()).toBe(true);
  });

  it('should mark as failed when gateway fails', async () => {
    mockRepo.save.mockResolvedValue(ok(undefined));
    mockGateway.send.mockResolvedValue(err(new Error('Gateway down')));
    mockRepo.update.mockResolvedValue(ok(undefined));
    const result = await useCase.execute(dto);
    expect(result.isErr()).toBe(true);
    expect(mockRepo.update).toHaveBeenCalled();
  });
});
