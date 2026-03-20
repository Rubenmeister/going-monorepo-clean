import { Test, TestingModule } from '@nestjs/testing';
import { MongoRideAnalyticsRepository } from '../mongo-ride-analytics.repository';

describe('MongoRideAnalyticsRepository', () => {
  let repository: MongoRideAnalyticsRepository;
  let mockAnalyticsModel: any;

  beforeEach(async () => {
    mockAnalyticsModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoRideAnalyticsRepository,
        {
          provide: 'RideAnalytics',
          useValue: mockAnalyticsModel,
        },
      ],
    }).compile();

    repository = module.get<MongoRideAnalyticsRepository>(MongoRideAnalyticsRepository);
  });

  describe('create', () => {
    it('should create analytics record', async () => {
      const analyticsData = {
        date: new Date('2026-02-19'),
        totalRides: 150,
        completedRides: 140,
        cancelledRides: 10,
        totalDistance: 2500,
        totalDuration: 3000,
        totalRevenue: 3500,
        platformRevenue: 700,
        driverEarnings: 2800,
      };

      mockAnalyticsModel.create.mockResolvedValue(analyticsData);

      const result = await repository.create(analyticsData);

      expect(mockAnalyticsModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.totalRides).toBe(150);
      expect(result.completedRides).toBe(140);
    });
  });

  describe('findByDate', () => {
    it('should find analytics by specific date', async () => {
      const date = new Date('2026-02-19');
      mockAnalyticsModel.findOne.mockResolvedValue({
        date,
        totalRides: 150,
        completedRides: 140,
      });

      const result = await repository.findByDate(date);

      expect(mockAnalyticsModel.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.totalRides).toBe(150);
    });

    it('should return null if no analytics for date', async () => {
      mockAnalyticsModel.findOne.mockResolvedValue(null);

      const result = await repository.findByDate(new Date('2025-01-01'));

      expect(result).toBeNull();
    });
  });

  describe('findByDateRange', () => {
    it('should find analytics for date range', async () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');

      const mockChain = {
        sort: jest.fn().mockResolvedValue([
          { date: new Date('2026-02-28'), totalRides: 150 },
          { date: new Date('2026-02-27'), totalRides: 145 },
          { date: new Date('2026-02-26'), totalRides: 155 },
        ]),
      };
      mockAnalyticsModel.find.mockReturnValue(mockChain);

      const result = await repository.findByDateRange(startDate, endDate);

      expect(mockAnalyticsModel.find).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });
  });

  describe('findLatest', () => {
    it('should find latest N days of analytics', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { date: new Date(), totalRides: 150 },
          { date: new Date(Date.now() - 86400000), totalRides: 145 },
          { date: new Date(Date.now() - 172800000), totalRides: 155 },
        ]),
      };
      mockAnalyticsModel.find.mockReturnValue(mockChain);

      const result = await repository.findLatest(30);

      expect(mockAnalyticsModel.find).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('should update analytics record', async () => {
      const date = new Date('2026-02-19');
      mockAnalyticsModel.findOneAndUpdate.mockResolvedValue({
        date,
        totalRides: 160,
        completedRides: 150,
      });

      const result = await repository.update(date, { totalRides: 160 });

      expect(mockAnalyticsModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result.totalRides).toBe(160);
    });

    it('should throw error if analytics not found', async () => {
      mockAnalyticsModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        repository.update(new Date('2025-01-01'), { totalRides: 100 })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete analytics record', async () => {
      const date = new Date('2026-02-19');
      mockAnalyticsModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await repository.delete(date);

      expect(mockAnalyticsModel.deleteOne).toHaveBeenCalled();
    });
  });
});
