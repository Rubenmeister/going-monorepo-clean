/**
 * Hook for rating operations
 */

import { useState, useCallback } from 'react';
import { ratingService } from '@/services/rating';
import type { StarRating, RatingSubmission, CategoryRatings } from '@/types';

export interface UseRatingServiceReturn {
  overallRating: StarRating | 0;
  review: string;
  categories: CategoryRatings;
  loading: boolean;
  error: string | null;
  submitted: boolean;
  setOverallRating: (rating: StarRating | 0) => void;
  setReview: (review: string) => void;
  setCategoryRating: (
    category: keyof CategoryRatings,
    rating: StarRating | 0
  ) => void;
  submitRating: (rideId: string, driverId: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing rating operations
 */
export function useRatingService(): UseRatingServiceReturn {
  const [overallRating, setOverallRating] = useState<StarRating | 0>(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryRatings>({
    cleanliness: 0,
    communication: 0,
    driving: 0,
  });

  const setCategoryRating = useCallback(
    (category: keyof CategoryRatings, rating: StarRating | 0) => {
      setCategories((prev) => ({
        ...prev,
        [category]: rating,
      }));
    },
    []
  );

  const submitRating = useCallback(
    async (rideId: string, driverId: string) => {
      // Validate
      if (overallRating === 0) {
        setError('Selecciona una calificación antes de enviar');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const submission: RatingSubmission = {
          rideId,
          driverId,
          overallRating,
          review,
          categories,
          timestamp: new Date(),
        };

        const response = await ratingService.submitRating(submission);

        if (response.success) {
          setSubmitted(true);
        } else {
          setError(response.message || 'No se pudo enviar la calificación');
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'No se pudo enviar la calificación';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [overallRating, review, categories]
  );

  const reset = useCallback(() => {
    setOverallRating(0);
    setReview('');
    setSubmitted(false);
    setError(null);
    setCategories({
      cleanliness: 0,
      communication: 0,
      driving: 0,
    });
  }, []);

  return {
    overallRating,
    review,
    categories,
    loading,
    error,
    submitted,
    setOverallRating,
    setReview,
    setCategoryRating,
    submitRating,
    reset,
  };
}
