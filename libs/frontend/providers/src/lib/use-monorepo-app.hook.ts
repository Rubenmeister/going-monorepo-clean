'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './auth-context.provider';

export const useMonorepoApp = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const authContext = useAuth();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Return auth as nested object with isLoading for compatibility
  const auth = {
    ...authContext,
    isLoading: !isLoaded,
  };

  return { isLoaded, auth };
};
