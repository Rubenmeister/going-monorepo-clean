import { create } from 'zustand';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
}

interface NotificationStore {
  isSupported: boolean;
  isGranted: boolean;
  notifications: PushNotification[];
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<void>;
  showNotification: (title: string, options?: NotificationOptions) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  isSupported: typeof window !== 'undefined' && 'Notification' in window,
  isGranted: typeof window !== 'undefined' && Notification.permission === 'granted',
  notifications: [],

  requestPermission: async () => {
    if (!get().isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    set({ isGranted: permission === 'granted' });
    return permission === 'granted';
  },

  subscribe: async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
      });

      console.log('[Push] Subscribed:', subscription);

      // Send subscription to backend
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
    }
  },

  showNotification: (title: string, options?: NotificationOptions) => {
    if (!get().isSupported || !get().isGranted) return;

    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/badge.png',
      ...options,
    });

    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: Date.now().toString(),
          title,
          body: options?.body || '',
          icon: options?.icon,
          badge: options?.badge,
        },
      ],
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => notification.close(), 5000);
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));
