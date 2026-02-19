import { create } from 'zustand';

/**
 * Notification interface for toast/alert messages
 */
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

/**
 * Modal state for managing multiple modals
 */
export interface ModalState {
  isOpen: boolean;
  data?: Record<string, unknown>;
}

/**
 * Theme type
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * UI state and actions
 */
export interface UIState {
  // State
  modals: Record<string, ModalState>;
  notifications: Notification[];
  sidebarOpen: boolean;
  theme: Theme;
  isGlobalLoading: boolean;

  // Modal actions
  openModal: (id: string, data?: Record<string, unknown>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Sidebar actions
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;

  // Theme actions
  setTheme: (theme: Theme) => void;

  // Global loading actions
  setGlobalLoading: (isLoading: boolean) => void;
}

/**
 * Generate unique ID for notifications
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Zustand store for UI state management
 * Handles modals, notifications, sidebar, theme, and loading states
 */
export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  modals: {},
  notifications: [],
  sidebarOpen: true,
  theme: 'system',
  isGlobalLoading: false,

  // Modal actions
  openModal: (id: string, data?: Record<string, unknown>) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: { isOpen: true, data },
      },
    }));
  },

  closeModal: (id: string) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: { isOpen: false },
      },
    }));
  },

  closeAllModals: () => {
    set((state) => {
      const allClosed = Object.keys(state.modals).reduce(
        (acc, key) => {
          acc[key] = { isOpen: false };
          return acc;
        },
        {} as Record<string, ModalState>
      );
      return { modals: allClosed };
    });
  },

  isModalOpen: (id: string) => {
    const { modals } = get();
    return modals[id]?.isOpen ?? false;
  },

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? 5000,
    };

    set((state) => ({
      notifications: [...state.notifications, fullNotification],
    }));

    // Auto-dismiss notification after duration
    if (fullNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, fullNotification.duration);
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  // Sidebar actions
  setSidebarOpen: (isOpen: boolean) => {
    set({ sidebarOpen: isOpen });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  // Theme actions
  setTheme: (theme: Theme) => {
    set({ theme });
  },

  // Global loading actions
  setGlobalLoading: (isLoading: boolean) => {
    set({ isGlobalLoading: isLoading });
  },
}));
