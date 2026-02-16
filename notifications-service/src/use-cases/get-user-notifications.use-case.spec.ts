import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { GetUserNotificationsUseCase } from '@going-monorepo-clean/domains-notification-application';
import { INotificationRepository, Notification, NotificationChannel } from '@going-monorepo-clean/domains-notification-core';

const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findPendingByChannel: jest.fn(), findByUserId: jest.fn() };

describe('GetUserNotificationsUseCase', () => {
  let useCase: GetUserNotificationsUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserNotificationsUseCase,
        { provide: INotificationRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(GetUserNotificationsUseCase);
  });

  it('should return mapped notifications', async () => {
    const notif = Notification.create({
      userId: 'user-1',
      channel: NotificationChannel.create('EMAIL')._unsafeUnwrap(),
      title: 'Welcome',
      body: 'Welcome to the platform',
    })._unsafeUnwrap();
    mockRepo.findByUserId.mockResolvedValue(ok([notif]));
    const results = await useCase.execute('user-1');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Welcome');
    expect(results[0].channel).toBe('EMAIL');
  });

  it('should return empty array when no notifications', async () => {
    mockRepo.findByUserId.mockResolvedValue(ok([]));
    const results = await useCase.execute('user-empty');
    expect(results).toEqual([]);
  });

  it('should throw on repository error', async () => {
    mockRepo.findByUserId.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute('user-1')).rejects.toThrow(InternalServerErrorException);
  });
});
