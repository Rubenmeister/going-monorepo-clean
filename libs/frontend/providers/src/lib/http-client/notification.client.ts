import { httpClient } from './http.client';

export interface CreateNotificationRequest {
  userId: string;
  channel: string;
  title: string;
  body: string;
}

export interface Notification {
  id: string;
  userId: string;
  channel: string;
  title: string;
  body: string;
  createdAt: string;
}

export class NotificationClient {
  async sendNotification(
    data: CreateNotificationRequest
  ): Promise<{ id: string }> {
    const result = await httpClient.post<{ id: string }>(
      '/notifications/send',
      data
    );
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const result = await httpClient.get<Notification[]>(
      `/notifications/user/${userId}`
    );
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }
}

export const notificationClient = new NotificationClient();
