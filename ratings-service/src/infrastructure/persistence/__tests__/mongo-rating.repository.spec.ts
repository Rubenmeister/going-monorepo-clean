import { Test, TestingModule } from '@nestjs/testing';
import { MongoRatingRepository } from '../mongo-rating.repository';

describe('MongoRatingRepository', () => {
  let repository: MongoRatingRepository;
  let mockRatingModel: any;

  beforeEach(async () => {
    mockRatingModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      deleteOne: jest.fn(),
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoRatingRepository,
        {
          provide: 'Rating',
          useValue: mockRatingModel,
        },
      ],
    }).compile();

    repository = module.get<MongoRatingRepository>(MongoRatingRepository);
  });

  describe('create', () => {
    it('should create a rating record', async () => {
      const ratingData = {
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

      mockRatingModel.create.mockResolvedValue({
        ratingId: ratingData.id,
        ...ratingData,
      });

      const result = await repository.create(ratingData);

      expect(mockRatingModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.stars).toBe(5);
      expect(result.review).toBe('Great driver!');
    });
  });

  describe('findById', () => {
    it('should find rating by id', async () => {
      const ratingId = 'rating-123';
      mockRatingModel.findOne.mockResolvedValue({
        ratingId,
        stars: 5,
        review: 'Great driver!',
      });

      const result = await repository.findById(ratingId);

      expect(mockRatingModel.findOne).toHaveBeenCalledWith({ ratingId });
      expect(result).toBeDefined();
      expect(result.stars).toBe(5);
    });

    it('should return null if rating not found', async () => {
      mockRatingModel.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByTrip', () => {
    it('should find rating by trip id', async () => {
      const tripId = 'trip-456';
      mockRatingModel.findOne.mockResolvedValue({
        tripId,
        stars: 4,
      });

      const result = await repository.findByTrip(tripId);

      expect(mockRatingModel.findOne).toHaveBeenCalledWith({ tripId });
      expect(result).toBeDefined();
      expect(result.stars).toBe(4);
    });
  });

  describe('findByRatee', () => {
    it('should find all ratings for a ratee', async () => {
      const rateeId = 'driver-012';
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { rateeId, stars: 5 },
          { rateeId, stars: 4 },
          { rateeId, stars: 5 },
        ]),
      };
      mockRatingModel.find.mockReturnValue(mockChain);

      const result = await repository.findByRatee(rateeId);

      expect(mockRatingModel.find).toHaveBeenCalledWith({ rateeId });
      expect(result).toHaveLength(3);
    });
  });

  describe('findByRateeWithStats', () => {
    it('should return ratings with calculated statistics', async () => {
      const rateeId = 'driver-012';
      const ratings = [
        { rateeId, stars: 5, review: 'Excellent' },
        { rateeId, stars: 4, review: 'Good' },
        { rateeId, stars: 5, review: 'Great' },
      ];

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(ratings),
      };
      mockRatingModel.find.mockReturnValue(mockChain);

      const result = await repository.findByRateeWithStats(rateeId);

      expect(result.ratings).toHaveLength(3);
      expect(result.stats.totalRatings).toBe(3);
      expect(result.stats.averageRating).toBe(4.7); // (5+4+5)/3
      expect(result.stats.fiveStarCount).toBe(2);
      expect(result.stats.fourStarCount).toBe(1);
    });

    it('should return empty stats when no ratings found', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      mockRatingModel.find.mockReturnValue(mockChain);

      const result = await repository.findByRateeWithStats('driver-999');

      expect(result.ratings).toHaveLength(0);
      expect(result.stats.totalRatings).toBe(0);
      expect(result.stats.averageRating).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete a rating', async () => {
      const ratingId = 'rating-123';
      mockRatingModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await repository.delete(ratingId);

      expect(mockRatingModel.deleteOne).toHaveBeenCalledWith({ ratingId });
    });
  });
});
