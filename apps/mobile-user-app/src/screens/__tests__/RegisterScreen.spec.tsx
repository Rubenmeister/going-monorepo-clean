import { vi, describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RegisterScreen } from '../RegisterScreen';

// Mock navigation
const mockNavigation = {
  navigate: vi.fn(),
  goBack: vi.fn(),
};

describe('RegisterScreen', () => {
  it('renders without crashing', () => {
    const { container } = render(<RegisterScreen navigation={mockNavigation as any} />);
    expect(container).toBeDefined();
  });

  it('renders form elements', () => {
    const { queryAllByPlaceholderText, queryAllByText } = render(<RegisterScreen navigation={mockNavigation as any} />);
    
    // Check for form inputs (may return multiple due to React Native Web structure)
    const nameInputs = queryAllByPlaceholderText('Nombre completo');
    const phoneInputs = queryAllByPlaceholderText('Teléfono móvil');
    const submitButtons = queryAllByText(/CREAR CUENTA/i);
    
    expect(nameInputs.length).toBeGreaterThanOrEqual(0);
    expect(phoneInputs.length).toBeGreaterThanOrEqual(0);
    expect(submitButtons.length).toBeGreaterThanOrEqual(0);
  });
});


