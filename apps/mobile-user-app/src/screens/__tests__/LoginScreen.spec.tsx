import { vi, describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoginScreen } from '../LoginScreen';

// Mock navigation
const mockNavigation = {
  navigate: vi.fn(),
};

// Mock safe area context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Mock AsyncStorage
// (Already mocked in test-setup.ts)

// Mock auth context
vi.mock('@going-monorepo-clean/frontend-providers', () => ({
  useAuth: () => ({
    login: vi.fn(),
    isLoading: false,
  }),
}));

// Mock lucide-react-native
// (Already mocked in test-setup.ts)

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation as any} />);
    expect(getByPlaceholderText('Correo electrónico')).toBeDefined();
    expect(getByPlaceholderText('Contraseña')).toBeDefined();
  });
});
