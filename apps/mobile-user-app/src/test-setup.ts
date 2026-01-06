import { vi } from 'vitest';

// Mock safe area context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    getAllKeys: vi.fn(),
    multiGet: vi.fn(),
    multiSet: vi.fn(),
    multiRemove: vi.fn(),
    mergeItem: vi.fn(),
  },
}));

// Mock lucide-react-native
vi.mock('lucide-react-native', () => ({
  Mail: () => null,
  Lock: () => null,
  ArrowRight: () => null,
  Smartphone: () => null,
  CheckCircle2: () => null,
  AlertCircle: () => null,
  MapPin: () => null,
  Search: () => null,
  Menu: () => null,
  Bell: () => null,
  User: () => null,
  Send: () => null,
  Phone: () => null,
  Shield: () => null,
  X: () => null,
  LogOut: () => null,
  Navigation: () => null,
  ArrowLeft: () => null,
  CreditCard: () => null,
  MessageCircle: () => null,
  Home: () => null,
  Map: () => null,
  Star: () => null,
  Package: () => null,
  Plus: () => null,
  Users: () => null,
}));

// Global mock for react-native internals that might be accessed
vi.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
