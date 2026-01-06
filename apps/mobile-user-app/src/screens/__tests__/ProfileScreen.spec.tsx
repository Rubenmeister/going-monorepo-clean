import { vi, describe, it, expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ProfileScreen } from '../ProfileScreen';
import { authService } from '../../features/auth/AuthService';

// Mock navigation
const mockNavigation = {
  replace: vi.fn(),
};

// Mock auth service
vi.mock('../../features/auth/AuthService', () => ({
  authService: {
    getCurrentUser: vi.fn().mockResolvedValue({ name: 'Juan Perez', email: 'juan@example.com' }),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('User ProfileScreen', () => {
  it('renders user information correctly', async () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation as any} />);
    
    await waitFor(() => {
      expect(getByText('Juan Perez')).toBeDefined();
      expect(getByText('juan@example.com')).toBeDefined();
    });
  });

  it('calls logout and navigates to Login', async () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation as any} />);
    
    await waitFor(() => expect(getByText('Cerrar Sesión')).toBeDefined());
    
    fireEvent.click(getByText('Cerrar Sesión'));
    
    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
      expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
    });
  });
});
