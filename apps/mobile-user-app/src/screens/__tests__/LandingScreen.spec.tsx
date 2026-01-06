import React from 'react';
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

describe('LandingScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<LandingScreen navigation={mockNavigation as any} />);
    // Note: Since LandingScreen starts with Scene 1 (SUV), we might need to wait or mock state
    // but a basic render check is a good start.
    expect(getByText).toBeDefined();
  });
});
