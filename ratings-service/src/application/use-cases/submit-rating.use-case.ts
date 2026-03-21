import { Injectable } from '@nestjs/common';
import {
  IRatingRepository,
  IDriverProfileRepository,
} from '../../domain/ports';

/**
 * Submit Rating Use Case
 * Creates a new rating for a rider or driver after trip completion
 */
@Injectable()
export class SubmitRatingUseCase {
  constructor(
    private ratingRepository: IRatingRepository,
    private driverProfileRepository: IDriverProfileRepository
  ) {}

  async execute(input: {
    id: string;
    tripId: string;
    raterId: string;
    rateeId: string;
    stars: number;
    review?: string;
    categories?: any;
    photos?: Array<{ url: string; caption?: string }>;
  }): Promise<any> {
    // Validate rating
    if (input.stars < 1 || input.stars > 5) {
      throw new Error('Rating must be between 1 and 5 stars');
    }

    if (input.review && input.review.length > 500) {
      throw new Error('Review cannot exceed 500 characters');
    }

    // Create rating
    const rating = await this.ratingRepository.create({
      id: input.id,
      tripId: input.tripId,
      raterId: input.raterId,
      rateeId: input.rateeId,
      stars: input.stars,
      review: input.review,
      categories: input.categories || {},
      photos: input.photos || [],
      createdAt: new Date(),
    });

    // Update driver profile if rating is for a driver
    await this.updateDriverProfileStats(input.rateeId);

    return rating;
  }

  private async updateDriverProfileStats(driverId: string): Promise<void> {
    try {
      const profile = await this.driverProfileRepository.findByDriver(driverId);
      const recentRatings = await this.ratingRepository.findByRatee(
        driverId,
        100
      );

      if (recentRatings.length === 0) return;

      let totalStars = 0;
      const categoryAverages = {
        cleanliness: 0,
        communication: 0,
        driving: 0,
        behavior: 0,
      };
      let categoryCount = 0;

      recentRatings.forEach((r) => {
        totalStars += r.stars;
        if (r.categories) {
          if (r.categories.cleanliness)
            categoryAverages.cleanliness += r.categories.cleanliness;
          if (r.categories.communication)
            categoryAverages.communication += r.categories.communication;
          if (r.categories.driving)
            categoryAverages.driving += r.categories.driving;
          if (r.categories.behavior)
            categoryAverages.behavior += r.categories.behavior;
          if (Object.keys(r.categories).length > 0) categoryCount++;
        }
      });

      const averageRating =
        Math.round((totalStars / recentRatings.length) * 10) / 10;

      // Update badges
      const badges = [];
      if (
        averageRating >= 4.8 &&
        profile.completedTrips >= 100 &&
        profile.cancellationRate <= 2
      ) {
        badges.push('super_driver');
      }
      if (averageRating >= 4.7) {
        badges.push('highly_rated');
      }
      if (profile.completedTrips >= 500) {
        badges.push('veteran_driver');
      }

      await this.driverProfileRepository.updateAggregateStats(driverId, {
        averageRating,
        totalRatings: recentRatings.length,
        badges,
        lastRated: new Date(),
      });
    } catch (error) {
      // Log error but don't fail the rating submission
      console.error(`Failed to update driver profile for ${driverId}:`, error);
    }
  }
}
