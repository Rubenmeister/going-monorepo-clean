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
  async sendNotification(data: CreateNotificationRequest): Promise<{ id: string }> {
    return httpClient.post<{ id: string }>('/notifications/send', data);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return httpClient.get<Notification[]>(
      `/notifications/user/${userId}`
    );
  }
}

export const notificationClient = new NotificationClient();
