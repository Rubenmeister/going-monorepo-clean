import { vi, describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { HomeScreen } from '../HomeScreen';

const mockNavigation = {
  navigate: vi.fn(),
};

describe('User HomeScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation as any} />);
    // Check if the greeting or main elements are present
    expect(getByText('PEDIR VIAJE')).toBeDefined();
    expect(getByText('ENVÍOS GOING')).toBeDefined();
  });

  it('toggles mode and shows form', () => {
    const { getByText, getAllByPlaceholderText } = render(<HomeScreen navigation={mockNavigation as any} />);
    
    // Switch to Pedir Viaje
    fireEvent.click(getByText('PEDIR VIAJE'));
    expect(getByText('¿A DÓNDE VAMOS HOY?')).toBeDefined();
    expect(getAllByPlaceholderText('Ciudad')).toHaveLength(2);
  });
});
