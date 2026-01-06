import { vi, describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { RegisterScreen } from '../RegisterScreen';

// Mock navigation
const mockNavigation = {
  navigate: vi.fn(),
  goBack: vi.fn(),
};

describe('RegisterScreen', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);
    
    expect(getByPlaceholderText('Nombre completo')).toBeDefined();
    expect(getByPlaceholderText('Teléfono móvil')).toBeDefined();
    expect(getByPlaceholderText('Correo electrónico')).toBeDefined();
    expect(getByText('Crear Cuenta')).toBeDefined();
  });

  it('shows validation errors for empty fields on submit', () => {
    const { getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);
    
    fireEvent.click(getByText('Crear Cuenta'));
    
    expect(getByText('El nombre es requerido')).toBeDefined();
    expect(getByText('El teléfono es requerido')).toBeDefined();
    expect(getByText('El correo es requerido')).toBeDefined();
    expect(getByText('La contraseña es requerida')).toBeDefined();
  });

  it('navigates to Login on successful registration', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);
    
    fireEvent.change(getByPlaceholderText('Nombre completo'), { target: { value: 'Juan Perez' } });
    fireEvent.change(getByPlaceholderText('Teléfono móvil'), { target: { value: '099999999' } });
    fireEvent.change(getByPlaceholderText('Correo electrónico'), { target: { value: 'juan@example.com' } });
    fireEvent.change(getByPlaceholderText('Contraseña'), { target: { value: '123456' } });
    fireEvent.change(getByPlaceholderText('Confirmar contraseña'), { target: { value: '123456' } });
    
    fireEvent.click(getByText('Crear Cuenta'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('shows error when passwords do not match', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen navigation={mockNavigation as any} />);
    
    fireEvent.change(getByPlaceholderText('Contraseña'), { target: { value: '123456' } });
    fireEvent.change(getByPlaceholderText('Confirmar contraseña'), { target: { value: '654321' } });
    
    fireEvent.click(getByText('Crear Cuenta'));
    
    expect(getByText('Las contraseñas no coinciden')).toBeDefined();
  });
});
