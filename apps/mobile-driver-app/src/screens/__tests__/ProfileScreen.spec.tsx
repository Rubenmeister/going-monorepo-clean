import { vi, describe, it, expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ProfileScreen } from '../ProfileScreen';
import { driverAuthService } from '../../features/auth/DriverAuthService';

// Mock navigation
const mockNavigation = {
  replace: vi.fn(),
};

// Mock driver auth service
vi.mock('../../features/auth/DriverAuthService', () => ({
  driverAuthService: {
    getCurrentUser: vi.fn().mockResolvedValue({ name: 'Mario Driver', email: 'mario@going.com', id: '123456789' }),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Driver ProfileScreen', () => {
  it('renders driver information correctly', async () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation as any} />);
    
    await waitFor(() => {
      expect(getByText('Mario Driver')).toBeDefined();
      expect(getByText('mario@going.com')).toBeDefined();
      expect(getByText('12345678...')).toBeDefined(); // Substring logic in ProfileScreen.tsx
    });
  });

  it('calls logout and navigates to Login', async () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation as any} />);
    
    await waitFor(() => expect(getByText('Cerrar Sesión')).toBeDefined());
    
    fireEvent.click(getByText('Cerrar Sesión'));
    
    await waitFor(() => {
      expect(driverAuthService.logout).toHaveBeenCalled();
      expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
    });
  });
});
