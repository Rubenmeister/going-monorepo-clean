import { Injectable } from '@nestjs/common';
import { IRatingRepository } from '@going/shared-infrastructure';

/**
 * List Ratings Use Case
 * Retrieves ratings with pagination and filtering
 */
@Injectable()
export class ListRatingsUseCase {
  constructor(private ratingRepository: IRatingRepository) {}

  async execute(input: {
    rateeId?: string;
    raterId?: string;
    limit?: number;
    offset?: number;
    minStars?: number;
    hasReview?: boolean;
  }): Promise<any> {
    const limit = input.limit || 20;
    const offset = input.offset || 0;

    let ratings: any[] = [];

    if (input.rateeId) {
      ratings = await this.ratingRepository.findByRatee(
        input.rateeId,
        limit,
        offset
      );
    } else if (input.raterId) {
      ratings = await this.ratingRepository.findByRater(
        input.raterId,
        limit,
        offset
      );
    }

    // Apply filters
    if (input.minStars) {
      ratings = ratings.filter((r) => r.stars >= input.minStars);
    }

    if (input.hasReview !== undefined) {
      ratings = ratings.filter((r) => (input.hasReview ? r.review : !r.review));
    }

    return {
      ratings,
      count: ratings.length,
      limit,
      offset,
    };
  }
}
