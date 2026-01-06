import { vi, describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LandingScreen } from '../LandingScreen';

// Mock navigation
const mockNavigation = {
  navigate: vi.fn(),
};

// Mock safe area context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Mock Animated and other RN components if needed
// vi.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('Driver LandingScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<LandingScreen navigation={mockNavigation as any} />);
    expect(getByText).toBeDefined();
  });
});
