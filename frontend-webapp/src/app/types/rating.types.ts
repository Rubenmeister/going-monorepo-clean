/**
 * Rating and review types
 */

export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface RatingCategory {
  name: string;
  emoji?: string;
}

export const RATING_CATEGORIES: Record<string, RatingCategory> = {
  cleanliness: { name: 'Cleanliness', emoji: '🧹' },
  communication: { name: 'Communication', emoji: '💬' },
  driving: { name: 'Driving', emoji: '🚗' },
};

export interface CategoryRatings {
  cleanliness: StarRating | 0;
  communication: StarRating | 0;
  driving: StarRating | 0;
}

export const STAR_LABELS: Record<StarRating, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export interface RatingSubmission {
  rideId: string;
  driverId: string;
  overallRating: StarRating;
  review: string;
  categories: CategoryRatings;
  timestamp: Date;
}

export interface RatingResponse {
  success: boolean;
  message: string;
  ratingId?: string;
}
