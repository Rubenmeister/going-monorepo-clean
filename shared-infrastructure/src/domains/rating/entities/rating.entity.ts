/**
 * Rating Entity (Phase 6)
 * Represents a user rating and review
 */
export class Rating {
  id: string;
  tripId: string;
  raterId: string;
  rateeId: string;

  stars: 1 | 2 | 3 | 4 | 5;
  review?: string;

  categories: {
    cleanliness?: 1 | 2 | 3 | 4 | 5;
    communication?: 1 | 2 | 3 | 4 | 5;
    driving?: 1 | 2 | 3 | 4 | 5; // For drivers only
    behavior?: 1 | 2 | 3 | 4 | 5; // For users only
  };

  photos: Array<{ url: string; caption?: string }> = [];
  createdAt: Date;

  constructor(props: {
    id: string;
    tripId: string;
    raterId: string;
    rateeId: string;
    stars: 1 | 2 | 3 | 4 | 5;
    review?: string;
    categories?: any;
    photos?: Array<{ url: string; caption?: string }>;
    createdAt?: Date;
  }) {
    if (props.stars < 1 || props.stars > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    this.id = props.id;
    this.tripId = props.tripId;
    this.raterId = props.raterId;
    this.rateeId = props.rateeId;
    this.stars = props.stars;
    this.review = props.review;
    this.categories = props.categories || {};
    this.photos = props.photos || [];
    this.createdAt = props.createdAt || new Date();
  }

  getAverageCategory(): number {
    const values = Object.values(this.categories).filter((v) => v);
    if (values.length === 0) return this.stars;
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }

  toObject() {
    return {
      id: this.id,
      tripId: this.tripId,
      raterId: this.raterId,
      rateeId: this.rateeId,
      stars: this.stars,
      review: this.review,
      categories: this.categories,
      photos: this.photos,
      averageCategory: this.getAverageCategory(),
      createdAt: this.createdAt,
    };
  }
}
