import { useState, useCallback } from 'react';

// Simplified Trip interface matching the one in DTO/Controller
export interface TransportTrip {
  id: string;
  from: string;
  to: string;
  status: string;
  driver: string | null;
}

export function useTransport() {
  const [results, setResults] = useState<TransportTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTrips = useCallback(async (query: string) => {
    if (!query) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Calls the API Gateway which proxies to proper service
      const res = await fetch(`/api/transport/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError('Error searching trips');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reassignTrip = async (tripId: string, driverId: string) => {
    // Placeholder for mutation
    console.log('Reassigning', tripId, 'to', driverId);
    // await fetch('/api/transport/request', ...);
  };

  return {
    results,
    loading,
    error,
    searchTrips,
    reassignTrip
  };
}
