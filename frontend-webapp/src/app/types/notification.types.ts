/**
 * Notification types
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: NotificationAction;
}

export type NotificationInput = Omit<Notification, 'id'>;

export const NOTIFICATION_DEFAULTS: Record<
  NotificationType,
  Partial<Notification>
> = {
  success: { duration: 3000 },
  error: { duration: 5000 },
  warning: { duration: 4000 },
  info: { duration: 3000 },
};
