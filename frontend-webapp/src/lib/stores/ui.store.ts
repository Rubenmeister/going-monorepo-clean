import { create } from 'zustand';

export interface Notification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

export interface ModalState {
  isOpen: boolean;
  data?: Record<string, unknown>;
}

export type Theme = 'light' | 'dark' | 'system';

export interface UIState {
  modals: Record<string, ModalState>;
  notifications: Notification[];
  sidebarOpen: boolean;
  theme: Theme;
  isGlobalLoading: boolean;
  openModal: (id: string, data?: Record<string, unknown>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  setGlobalLoading: (isLoading: boolean) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useUIStore = create<UIState>((set, get) => ({
  modals: {},
  notifications: [],
  sidebarOpen: true,
  theme: 'system',
  isGlobalLoading: false,

  openModal: (id, data) =>
    set((state) => ({
      modals: { ...state.modals, [id]: { isOpen: true, data } },
    })),
  closeModal: (id) =>
    set((state) => ({ modals: { ...state.modals, [id]: { isOpen: false } } })),
  closeAllModals: () =>
    set((state) => ({
      modals: Object.keys(state.modals).reduce((acc, key) => {
        acc[key] = { isOpen: false };
        return acc;
      }, {} as Record<string, ModalState>),
    })),
  isModalOpen: (id) => get().modals[id]?.isOpen ?? false,

  addNotification: (notification) => {
    const id = generateId();
    const full: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? 5000,
    };
    set((state) => ({ notifications: [...state.notifications, full] }));
    if (full.duration && full.duration > 0) {
      setTimeout(() => get().removeNotification(id), full.duration);
    }
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),

  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),
}));
