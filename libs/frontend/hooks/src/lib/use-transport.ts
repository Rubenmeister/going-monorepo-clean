import { useState } from 'react';
import { dependencyProvider } from '@going-monorepo-clean/frontend-providers';
import { RequestTripDto, TripViewModel } from '@going-monorepo-clean/domains-transport-frontend-application';

export const useTransport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<TripViewModel | null>(null);

  const requestTrip = async (dto: RequestTripDto, token: string) => {
    setIsLoading(true);
    setError(null);

    const result = await dependencyProvider.requestTripUseCase.execute(dto, token);

    setIsLoading(false);

    if (result.isErr()) {
      setError(result.error.message);
      return null;
    }

    setActiveTrip(result.value);
    return result.value;
  };

  const checkActiveTrip = async (userId: string, token: string) => {
    const result = await dependencyProvider.getActiveTripUseCase.execute(userId, token);

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
