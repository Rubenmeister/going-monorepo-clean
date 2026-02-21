'use client';

import { useRatingService } from '@/hooks/features/useRatingService';
import type { StarRating, CategoryRatings } from '@/types';
import { RATING_CATEGORIES, STAR_LABELS } from '@/types';

interface RatingFormProps {
  rideId?: string;
  driverId?: string;
  driverName?: string;
  onSubmit?: (rating: any) => void;
  onComplete?: () => void;
}

/**
 * Rating form component for rating drivers after a ride
 */
export function RatingForm({
  rideId = '',
  driverId = '',
  driverName = 'your driver',
  onSubmit,
  onComplete,
}: RatingFormProps) {
  const {
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
  } = useRatingService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRating(rideId, driverId);
    onSubmit?.({ overallRating, review, categories });

    // Call onComplete after a short delay
    if (submitted) {
      setTimeout(() => onComplete?.(), 1500);
    }
  };

  if (submitted) {
    return (
      <div
        className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg text-center"
        data-testid="rating-confirmation"
      >
        <p className="font-semibold">Thank you for rating!</p>
        <p className="text-sm">Your feedback helps us improve</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6"
      data-testid="rating-modal"
    >
      <h3
        className="text-lg font-bold text-gray-800 mb-4"
        data-testid="rating-title"
      >
        Rate {driverName}
      </h3>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800">
          {error}
        </div>
      )}

      {/* Overall star rating */}
      <OverallRatingSection
        rating={overallRating}
        onRatingChange={setOverallRating}
      />

      {/* Category ratings */}
      <CategoryRatingsSection
        categories={categories}
        onCategoryChange={setCategoryRating}
      />

      {/* Review text */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your feedback (optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          maxLength={500}
          placeholder="Tell us about your experience..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-going-primary outline-none"
          data-testid="review-text"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">{review.length}/500</p>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={overallRating === 0 || loading}
        className="w-full bg-going-primary text-white py-2 rounded-lg font-semibold hover:bg-going-dark disabled:bg-gray-400 transition"
        data-testid="submit-rating-button"
      >
        {loading ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
}

/**
 * Overall rating section with star selection
 */
function OverallRatingSection({
  rating,
  onRatingChange,
}: {
  rating: StarRating | 0;
  onRatingChange: (rating: StarRating | 0) => void;
}) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        How was your ride?
      </label>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star as StarRating)}
            className="text-4xl transition transform hover:scale-110"
            data-testid={`star-${star}`}
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-center text-sm text-gray-600 mt-2">
          {STAR_LABELS[rating as StarRating]}
        </p>
      )}
    </div>
  );
}

/**
 * Category ratings section
 */
function CategoryRatingsSection({
  categories,
  onCategoryChange,
}: {
  categories: CategoryRatings;
  onCategoryChange: (
    category: keyof CategoryRatings,
    rating: StarRating | 0
  ) => void;
}) {
  return (
    <div className="mb-6 space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Rate categories
      </label>
      {(
        Object.entries(RATING_CATEGORIES) as Array<
          [
            keyof CategoryRatings,
            (typeof RATING_CATEGORIES)[keyof CategoryRatings]
          ]
        >
      ).map(([category, config]) => (
        <div key={String(category)}>
          <p className="text-xs text-gray-600 capitalize mb-2">
            {config.emoji} {config.name}
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onCategoryChange(category, star as StarRating)}
                className="text-xl transition"
                data-testid={`category-${String(category)}-${star}`}
              >
                {star <= categories[category] ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
