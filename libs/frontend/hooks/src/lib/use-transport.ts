import { useState } from 'react';
import { dependencyProvider } from '@going-monorepo-clean/frontend-providers';
import { RequestTripDto } from '@going-monorepo-clean/domains-transport-frontend-application';
import { Trip } from '@going-monorepo-clean/domains-transport-frontend-core';

export const useTransport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  // Solicitar un viaje
  const requestTrip = async (dto: RequestTripDto) => {
    setIsLoading(true);
    setError(null);
    
    const result = await dependencyProvider.requestTripUseCase.execute(dto);
    
    setIsLoading(false);
    
    if (result.isErr()) {
      setError(result.error.message);
      return null;
    }
    
    setActiveTrip(result.value);
    return result.value;
  };

  // Consultar si hay un viaje activo (ej. al cargar la app)
  const checkActiveTrip = async (userId: string) => {
    // Nota: En una app real, obtendríamos el userId del AuthContext automáticamente
    const result = await dependencyProvider.getActiveTripUseCase.execute(userId);
    
    if (result.isOk()) {
      setActiveTrip(result.value);
    }
  };

  return {
    requestTrip,
    checkActiveTrip,
    activeTrip,
    isLoading,
    error
  };
};