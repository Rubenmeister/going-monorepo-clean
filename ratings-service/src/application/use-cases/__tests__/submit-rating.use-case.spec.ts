import { Test, TestingModule } from '@nestjs/testing';
import { SubmitRatingUseCase } from '../submit-rating.use-case';

describe('SubmitRatingUseCase', () => {
  let useCase: SubmitRatingUseCase;
  let mockRatingRepository: any;
  let mockDriverProfileRepository: any;

  beforeEach(async () => {
    mockRatingRepository = {
      create: jest.fn(),
      findByRatee: jest.fn(),
    };

    mockDriverProfileRepository = {
      findByDriver: jest.fn(),
      updateAggregateStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitRatingUseCase,
        {
          provide: 'IRatingRepository',
          useValue: mockRatingRepository,
        },
        {
          provide: 'IDriverProfileRepository',
          useValue: mockDriverProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get<SubmitRatingUseCase>(SubmitRatingUseCase);
  });

  describe('execute', () => {
    it('should submit a valid rating', async () => {
      const input = {
        id: 'rating-123',
        tripId: 'trip-456',
        raterId: 'user-789',
        rateeId: 'driver-012',
        stars: 5,
        review: 'Great driver!',
        categories: {
          cleanliness: 5,
          communication: 5,
          driving: 5,
        },
      };

      mockRatingRepository.create.mockResolvedValue(input);
      mockDriverProfileRepository.findByDriver.mockResolvedValue({
        driverId: 'driver-012',
        completedTrips: 100,
        cancellationRate: 1,
      });
      mockRatingRepository.findByRatee.mockResolvedValue([input]);
      mockDriverProfileRepository.updateAggregateStats.mockResolvedValue({
        driverId: 'driver-012',
        averageRating: 5.0,
        totalRatings: 1,
        badges: ['super_driver'],
      });

      const result = await useCase.execute(input);

      expect(mockRatingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stars: 5,
          review: 'Great driver!',
        })
      );
      expect(result).toBeDefined();
      expect(result.stars).toBe(5);
    });

    it('should reject rating with stars below 1', async () => {
      const input = {
        id: 'rating-123',
        tripId: 'trip-456',
        raterId: 'user-789',
        rateeId: 'driver-012',
        stars: 0,
        review: 'Bad driver',
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Rating must be between 1 and 5 stars'
      );
    });

    it('should reject rating with stars above 5', async () => {
      const input = {
        id: 'rating-123',
        tripId: 'trip-456',
        raterId: 'user-789',
        rateeId: 'driver-012',
        stars: 6,
        review: 'Great driver!',
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Rating must be between 1 and 5 stars'
      );
    });

    it('should reject review longer than 500 characters', async () => {
      const longReview = 'a'.repeat(501);
      const input = {
        id: 'rating-123',
        tripId: 'trip-456',
        raterId: 'user-789',
        rateeId: 'driver-012',
        stars: 5,
        review: longReview,
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Review cannot exceed 500 characters'
      );
    });

    it('should update driver profile after rating submission', async () => {
      const input = {
        id: 'rating-123',
        tripId: 'trip-456',
        raterId: 'user-789',
        rateeId: 'driver-012',
        stars: 5,
        review: 'Great driver!',
      };

      mockRatingRepository.create.mockResolvedValue(input);
      mockDriverProfileRepository.findByDriver.mockResolvedValue({
        driverId: 'driver-012',
        completedTrips: 100,
        cancellationRate: 1,
      });
      mockRatingRepository.findByRatee.mockResolvedValue([input]);
      mockDriverProfileRepository.updateAggregateStats.mockResolvedValue({
        driverId: 'driver-012',
        averageRating: 5.0,
        totalRatings: 1,
      });

      await useCase.execute(input);

      expect(mockDriverProfileRepository.updateAggregateStats).toHaveBeenCalled();
    });

    it('should award super_driver badge when criteria met', async () => {
      const input = {
        id: 'rating-123',
        tripId: 'trip-456',
        raterId: 'user-789',
        rateeId: 'driver-012',
        stars: 5,
      };

      mockRatingRepository.create.mockResolvedValue(input);
      mockDriverProfileRepository.findByDriver.mockResolvedValue({
        driverId: 'driver-012',
        completedTrips: 150,
        cancellationRate: 1.5,
      });
      mockRatingRepository.findByRatee.mockResolvedValue(Array(50).fill(input));
      mockDriverProfileRepository.updateAggregateStats.mockResolvedValue({
        driverId: 'driver-012',
        averageRating: 4.8,
        totalRatings: 50,
        badges: ['super_driver', 'highly_rated'],
      });

      await useCase.execute(input);

      expect(mockDriverProfileRepository.updateAggregateStats).toHaveBeenCalledWith(
        'driver-012',
        expect.objectContaining({
          badges: expect.arrayContaining(['super_driver']),
        })
      );
    });
  });
});
