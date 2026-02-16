import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { INotificationRepository } from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    @Inject(INotificationRepository)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(notificationId: UUID): Promise<void> {
    const result = await this.notificationRepo.findById(notificationId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Notification with id ${notificationId} not found`);
    }

    const notification = result.value;
    notification.markAsRead();

    const updateResult = await this.notificationRepo.update(notification);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }
  }
}
