import { vi, describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { HomeScreen } from '../HomeScreen';

const mockNavigation = {
  navigate: vi.fn(),
};

describe('Driver HomeScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation as any} />);
    expect(getByText('HOY')).toBeDefined();
    expect(getByText('INICIAR TURNO')).toBeDefined();
  });

  it('toggles status when clicking the button', () => {
    const { getByText, queryByText } = render(<HomeScreen navigation={mockNavigation as any} />);
    
    expect(getByText('DESCONECTADO')).toBeDefined();
    
    fireEvent.click(getByText('INICIAR TURNO'));
    
    expect(getByText('EN LÍNEA')).toBeDefined();
    expect(getByText('SALIR DE TURNO')).toBeDefined();
  });
});
