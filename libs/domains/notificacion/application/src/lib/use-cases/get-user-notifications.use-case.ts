import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { INotificationRepository, NotificationStatus } from '@going-monorepo-clean/domains-notification-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type UserNotificationDto = {
  id: UUID;
  title: string;
  body: string;
  channel: string;
  status: NotificationStatus;
  sentAt?: Date;
  readAt?: Date;
};

@Injectable()
export class GetUserNotificationsUseCase {
  constructor(
    @Inject(INotificationRepository)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(userId: UUID, limit = 20): Promise<UserNotificationDto[]> {
    const notificationsResult = await this.notificationRepo.findByUserId(userId, limit);

    if (notificationsResult.isErr()) {
      throw new InternalServerErrorException(notificationsResult.error.message);
    }
    const notifications = notificationsResult.value;

    return notifications.map((notification) => {
      const props = notification.toPrimitives();
      return {
        id: props.id,
        title: props.title,
        body: props.body,
        channel: props.channel,
        status: props.status,
        sentAt: props.sentAt,
        readAt: props.readAt,
      };
    });
  }
}