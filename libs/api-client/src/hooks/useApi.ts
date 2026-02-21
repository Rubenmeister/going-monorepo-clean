'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../core/fetch-client';
import type { UseApiOptions, UseApiResult, ApiError } from '../types';

export function useApi<T = any>({
  url,
  method = 'GET',
  data,
  enabled = true,
  onSuccess,
  onError,
}: UseApiOptions<T>): UseApiResult<T> {
  const [result, setResult] = useState<UseApiResult<T>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchData = async () => {
    try {
      setResult((prev) => ({ ...prev, loading: true, error: null }));

      let response: T;
      switch (method) {
        case 'POST':
          response = await apiClient.post(url, data);
          break;
        case 'PUT':
          response = await apiClient.put(url, data);
          break;
        case 'DELETE':
          response = await apiClient.delete(url);
          break;
        default:
          response = await apiClient.get(url);
      }

      setResult((prev) => ({
        ...prev,
        data: response,
        loading: false,
        error: null,
      }));

      onSuccess?.(response);
    } catch (err) {
      const error = err as ApiError;
      setResult((prev) => ({
        ...prev,
        loading: false,
        error,
      }));
      onError?.(error);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, url, method, JSON.stringify(data)]);

  return {
    ...result,
    refetch: fetchData,
  };
}
