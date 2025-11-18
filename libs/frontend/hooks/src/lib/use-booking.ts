import { useState } from 'react';
import { dependencyProvider } from '@going-monorepo-clean/frontend-providers';
import { CreateBookingDto } from '@going-monorepo-clean/domains-booking-frontend-application';

export const useBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (dto: CreateBookingDto) => {
    setIsLoading(true);
    setError(null);
    
    // Usamos el caso de uso directamente desde el provider
    const result = await dependencyProvider.createBookingUseCase.execute(dto);
    
    setIsLoading(false);
    
    if (result.isErr()) {
      setError(result.error.message);
      return null;
    }
    
    return result.value; // Devuelve la reserva creada
  };

  return {
    createBooking,
    isLoading,
    error
  };
};