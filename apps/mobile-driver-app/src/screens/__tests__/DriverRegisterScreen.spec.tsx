import { vi, describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DriverRegisterScreen } from '../DriverRegisterScreen';

const mockNavigation = {
  navigate: vi.fn(),
  goBack: vi.fn(),
};

describe('DriverRegisterScreen', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(<DriverRegisterScreen navigation={mockNavigation as any} />);
    expect(getByPlaceholderText('Nombre Completo')).toBeDefined();
    expect(getByPlaceholderText('Licencia de Conducir')).toBeDefined();
    expect(getByText('Enviar Solicitud')).toBeDefined();
  });

  it('navigates to Login on successful submission', () => {
    const { getByText } = render(<DriverRegisterScreen navigation={mockNavigation as any} />);
    fireEvent.click(getByText('Enviar Solicitud'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });
});
