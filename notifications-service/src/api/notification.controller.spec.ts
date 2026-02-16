import { BadRequestException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { NotificationController } from './notification.controller';

const mockSendUseCase = { execute: jest.fn() };
const mockGetUseCase = { execute: jest.fn() };
const mockMarkReadUseCase = { execute: jest.fn() };

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new NotificationController(
      mockSendUseCase as any,
      mockGetUseCase as any,
      mockMarkReadUseCase as any,
    );
  });

  it('should send notification successfully', async () => {
    mockSendUseCase.execute.mockResolvedValue(ok({ id: 'notif-1' }));
    const result = await controller.sendNotification({} as any);
    expect(result).toEqual({ id: 'notif-1' });
  });

  it('should throw BadRequestException when send fails', async () => {
    mockSendUseCase.execute.mockResolvedValue(err(new Error('Failed')));
    await expect(controller.sendNotification({} as any)).rejects.toThrow(BadRequestException);
  });

  it('should get user notifications', async () => {
    mockGetUseCase.execute.mockResolvedValue([{ title: 'Test' }]);
    const result = await controller.getNotifications('user-1');
    expect(result).toHaveLength(1);
    expect(mockGetUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('should mark notification as read', async () => {
    mockMarkReadUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.markAsRead('notif-1');
    expect(result).toEqual({ message: 'Notification marked as read' });
    expect(mockMarkReadUseCase.execute).toHaveBeenCalledWith('notif-1');
  });
});
