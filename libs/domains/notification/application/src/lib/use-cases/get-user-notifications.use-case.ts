import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { INotificationRepository, I_NOTIFICATION_REPOSITORY } from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type UserNotificationDto = {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GetUserNotificationsUseCase {
  constructor(
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(userId: UUID): Promise<UserNotificationDto[]> {
    const notificationsResult = await this.notificationRepo.findByUserId(userId);

    if (notificationsResult.isErr()) {
      throw new InternalServerErrorException(notificationsResult.error.message);
    }
    const notifications = notificationsResult.value;

    return notifications.map((notification) => {
      const props = notification.toPrimitives();
      return {
        id: props.id,
        title: props.title,
        content: props.content,
        type: props.type,
        isRead: props.isRead,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      };
    });
  }
}