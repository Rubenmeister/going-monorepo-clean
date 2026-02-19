'use client';

import { useState } from 'react';

interface RatingFormProps {
  rideId?: string;
  driverId?: string;
  driverName?: string;
  onSubmit?: (rating: RatingData) => void;
  onComplete?: () => void;
}

interface RatingData {
  stars: number;
  review: string;
  categories: {
    cleanliness: number;
    communication: number;
    driving: number;
  };
}

export function RatingForm({ driverName = 'your driver', onSubmit, onComplete }: RatingFormProps) {
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [categories, setCategories] = useState({
    cleanliness: 0,
    communication: 0,
    driving: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (stars === 0) {
      alert('Please select a rating');
      return;
    }

    const ratingData: RatingData = {
      stars,
      review,
      categories,
    };

    onSubmit?.(ratingData);
    setSubmitted(true);
    setTimeout(() => onComplete?.(), 1500);
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
      <h3 className="text-lg font-bold text-gray-800 mb-4" data-testid="rating-title">
        Rate {driverName}
      </h3>

      {/* Star rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How was your ride?
        </label>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setStars(star)}
              className="text-4xl transition transform hover:scale-110"
              data-testid={`star-${star}`}
            >
              {star <= stars ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        {stars > 0 && (
          <p className="text-center text-sm text-gray-600 mt-2">
            {stars === 1 && 'Poor'}
            {stars === 2 && 'Fair'}
            {stars === 3 && 'Good'}
            {stars === 4 && 'Very Good'}
            {stars === 5 && 'Excellent'}
          </p>
        )}
      </div>

      {/* Category ratings */}
      <div className="mb-6 space-y-4">
        <label className="block text-sm font-medium text-gray-700">Rate categories</label>
        {(['cleanliness', 'communication', 'driving'] as const).map((category) => (
          <div key={category}>
            <p className="text-xs text-gray-600 capitalize mb-2">{category}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setCategories({ ...categories, [category]: star })
                  }
                  className="text-xl transition"
                  data-testid={`category-${category}-${star}`}
                >
                  {star <= categories[category] ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

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
        disabled={stars === 0}
        className="w-full bg-going-primary text-white py-2 rounded-lg font-semibold hover:bg-going-dark disabled:bg-gray-400 transition"
        data-testid="submit-rating-button"
      >
        Submit Rating
      </button>
    </form>
  );
}

export default RatingForm;
