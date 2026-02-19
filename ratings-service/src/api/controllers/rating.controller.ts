import { Controller, Post, Get, Param, Body, HttpStatus } from '@nestjs/common';
import { IRatingRepository, IDriverProfileRepository } from '@going/shared-infrastructure';
import { SubmitRatingUseCase } from '../../application/use-cases/submit-rating.use-case';
import { v4 as uuidv4 } from 'uuid';

export class SubmitRatingDTO {
  tripId: string;
  raterId: string;
  rateeId: string;
  stars: number;
  review?: string;
  categories?: any;
  photos?: Array<{ url: string; caption?: string }>;
}

/**
 * Rating API Controller
 * Handles rating creation and retrieval
 */
@Controller('api/ratings')
export class RatingController {
  constructor(
    private submitRatingUseCase: SubmitRatingUseCase,
    private ratingRepository: IRatingRepository,
    private driverProfileRepository: IDriverProfileRepository
  ) {}

  @Post('submit')
  async submitRating(@Body() dto: SubmitRatingDTO) {
    const ratingId = uuidv4();
    const rating = await this.submitRatingUseCase.execute({
      id: ratingId,
      tripId: dto.tripId,
      raterId: dto.raterId,
      rateeId: dto.rateeId,
      stars: dto.stars,
      review: dto.review,
      categories: dto.categories,
      photos: dto.photos,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Rating submitted successfully',
      data: rating,
    };
  }

  @Get('rating/:id')
  async getRating(@Param('id') id: string) {
    const rating = await this.ratingRepository.findById(id);

    if (!rating) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Rating not found',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: rating,
    };
  }

  @Get('trip/:tripId')
  async getRatingByTrip(@Param('tripId') tripId: string) {
    const rating = await this.ratingRepository.findByTrip(tripId);

    if (!rating) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No rating found for this trip',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: rating,
    };
  }

  @Get('driver/:driverId/stats')
  async getDriverStats(@Param('driverId') driverId: string) {
    const profile = await this.driverProfileRepository.findByDriver(driverId);
    const recentRatings = await this.ratingRepository.findByRatee(driverId, 50);

    return {
      statusCode: HttpStatus.OK,
      data: {
        profile,
        recentRatings,
        summary: {
          averageRating: profile.averageRating,
          totalRatings: profile.totalRatings,
          completedTrips: profile.completedTrips,
          acceptanceRate: profile.acceptanceRate,
          cancellationRate: profile.cancellationRate,
          badges: profile.badges,
        },
      },
    };
  }

  @Get('driver/:driverId/reviews')
  async getDriverReviews(@Param('driverId') driverId: string) {
    const ratings = await this.ratingRepository.findByRatee(driverId, 20);

    const filteredRatings = ratings
      .filter((r) => r.review)
      .map((r) => ({
        stars: r.stars,
        review: r.review,
        createdAt: r.createdAt,
      }));

    return {
      statusCode: HttpStatus.OK,
      data: filteredRatings,
    };
  }

  @Get('user/:userId/ratings-given')
  async getUserRatingsGiven(@Param('userId') userId: string) {
    const ratings = await this.ratingRepository.findByRater(userId, 20);

    return {
      statusCode: HttpStatus.OK,
      data: ratings,
    };
  }

  @Get('top-drivers')
  async getTopRatedDrivers() {
    const drivers = await this.driverProfileRepository.findTopRatedDrivers(10);

    return {
      statusCode: HttpStatus.OK,
      data: drivers,
    };
  }

  @Get('super-drivers')
  async getSuperDrivers() {
    const drivers = await this.driverProfileRepository.findSuperDrivers();

    return {
      statusCode: HttpStatus.OK,
      data: drivers,
    };
  }
}
