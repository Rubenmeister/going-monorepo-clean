import { Injectable, BadRequestException } from '@nestjs/common';
import {
  IRatingRepository,
  IDriverProfileRepository,
} from '../../domain/ports';

/**
 * Delete Rating Use Case
 * Allows deleting a rating with admin/owner verification
 */
@Injectable()
export class DeleteRatingUseCase {
  constructor(
    private ratingRepository: IRatingRepository,
    private driverProfileRepository: IDriverProfileRepository
  ) {}

  async execute(input: {
    ratingId: string;
    userId: string;
    isAdmin?: boolean;
  }): Promise<void> {
    // Fetch existing rating
    const rating = await this.ratingRepository.findById(input.ratingId);

    if (!rating) {
      throw new BadRequestException('Rating not found');
    }

    // Verify ownership or admin status
    if (!input.isAdmin && rating.raterId !== input.userId) {
      throw new BadRequestException('You can only delete your own ratings');
    }

    const rateeId = rating.rateeId;

    // Delete rating
    await this.ratingRepository.delete(input.ratingId);

    // Recalculate driver profile stats
    await this.updateDriverProfileStats(rateeId);
  }

  private async updateDriverProfileStats(driverId: string): Promise<void> {
    try {
      const profile = await this.driverProfileRepository.findByDriver(driverId);
      const recentRatings = await this.ratingRepository.findByRatee(
        driverId,
        100
      );

      if (recentRatings.length === 0) {
        // Reset profile if no ratings
        await this.driverProfileRepository.updateAggregateStats(driverId, {
          averageRating: 0,
          totalRatings: 0,
          badges: [],
          lastRated: null,
        });
        return;
      }

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
