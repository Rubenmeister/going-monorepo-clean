import { Injectable, BadRequestException } from '@nestjs/common';
import {
  IRatingRepository,
  IDriverProfileRepository,
} from '@going/shared-infrastructure';

/**
 * Update Rating Use Case
 * Allows updating a rating within a grace period
 */
@Injectable()
export class UpdateRatingUseCase {
  private readonly GRACE_PERIOD_HOURS = 24;

  constructor(
    private ratingRepository: IRatingRepository,
    private driverProfileRepository: IDriverProfileRepository
  ) {}

  async execute(input: {
    ratingId: string;
    raterId: string;
    stars?: number;
    review?: string;
    categories?: any;
  }): Promise<any> {
    // Fetch existing rating
    const rating = await this.ratingRepository.findById(input.ratingId);

    if (!rating) {
      throw new BadRequestException('Rating not found');
    }

    // Verify ownership
    if (rating.raterId !== input.raterId) {
      throw new BadRequestException('You can only update your own ratings');
    }

    // Check grace period (24 hours from creation)
    const createdDate = new Date(rating.createdAt);
    const now = new Date();
    const hoursElapsed =
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed > this.GRACE_PERIOD_HOURS) {
      throw new BadRequestException(
        `Cannot update rating after ${this.GRACE_PERIOD_HOURS} hours`
      );
    }

    // Validate new rating
    if (input.stars && (input.stars < 1 || input.stars > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5 stars');
    }

    if (input.review && input.review.length > 500) {
      throw new BadRequestException('Review cannot exceed 500 characters');
    }

    // Update rating
    const updatedRating = await this.ratingRepository.update(input.ratingId, {
      stars: input.stars || rating.stars,
      review: input.review || rating.review,
      categories: input.categories || rating.categories,
      updatedAt: new Date(),
    });

    // Re-calculate driver profile stats if stars changed
    if (input.stars && input.stars !== rating.stars) {
      await this.updateDriverProfileStats(rating.rateeId);
    }

    return updatedRating;
  }

  private async updateDriverProfileStats(driverId: string): Promise<void> {
    try {
      const profile = await this.driverProfileRepository.findByDriver(driverId);
      const recentRatings = await this.ratingRepository.findByRatee(
        driverId,
        100
      );

      if (recentRatings.length === 0) return;

      const totalStars = recentRatings.reduce((sum, r) => sum + r.stars, 0);
      const averageRating =
        Math.round((totalStars / recentRatings.length) * 10) / 10;

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

      await this.driverProfileRepository.updateAggregateStats(driverId, {
        averageRating,
        totalRatings: recentRatings.length,
        badges,
        lastRated: new Date(),
      });
    } catch (error) {
      console.error(`Failed to update driver profile for ${driverId}:`, error);
    }
  }
}
