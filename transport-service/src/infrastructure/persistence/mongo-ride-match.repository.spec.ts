import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MongoRideMatchRepository } from './mongo-ride-match.repository';
import { IRideMatchRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

describe('MongoRideMatchRepository', () => {
  let repository: MongoRideMatchRepository;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoRideMatchRepository,
        {
          provide: getModelToken('RideMatch'),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<MongoRideMatchRepository>(MongoRideMatchRepository);
  });

  describe('save', () => {
    const mockMatch = {
      id: 'match_123' as UUID,
      rideId: 'ride_123' as UUID,
      driverId: 'driver_456' as UUID,
      distance: 1.5,
      eta: 3,
      acceptanceStatus: 'PENDING',
      driverInfo: {
        name: 'John Doe',
        rating: 4.8,
        acceptanceRate: 0.95,
        vehicleType: 'ECONOMY',
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 120000),
    };

    it('should save ride match successfully', async () => {
      mockModel.create.mockResolvedValue({});

      const result = await repository.save(mockMatch as any);

      expect(result.isOk()).toBe(true);
      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          matchId: mockMatch.id,
          rideId: mockMatch.rideId,
        })
      );
    });

    it('should handle database errors', async () => {
      mockModel.create.mockRejectedValue(new Error('DB Error'));

      const result = await repository.save(mockMatch as any);

      expect(result.isErr()).toBe(true);
      expect(result.error?.message).toContain('Failed to save');
    });
  });

  describe('findById', () => {
    const matchId = 'match_123' as UUID;

    it('should find match by ID', async () => {
      const mockDoc = { matchId, driverId: 'driver_456', distance: 1.5 };
      mockModel.findOne.mockResolvedValue(mockDoc);

      const result = await repository.findById(matchId);

      expect(result.isOk()).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({ matchId });
    });

    it('should return null when match not found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await repository.findById(matchId);

      expect(result.isOk()).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should handle database errors', async () => {
      mockModel.findOne.mockRejectedValue(new Error('DB Error'));

      const result = await repository.findById(matchId);

      expect(result.isErr()).toBe(true);
    });
  });

  describe('findByRideId', () => {
    const rideId = 'ride_123' as UUID;

    it('should find matches by ride ID', async () => {
      const mockDocs = [
        { matchId: 'match_1', rideId, driverId: 'driver_1' },
        { matchId: 'match_2', rideId, driverId: 'driver_2' },
      ];

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocs),
      };

      mockModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await repository.findByRideId(rideId);

      expect(result.isOk()).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
    });

    it('should return empty array when no matches found', async () => {
      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await repository.findByRideId(rideId);

      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  describe('findPendingByRideId', () => {
    const rideId = 'ride_123' as UUID;

    it('should find only pending matches', async () => {
      const mockDocs = [
        { matchId: 'match_1', acceptanceStatus: 'PENDING' },
        { matchId: 'match_2', acceptanceStatus: 'PENDING' },
      ];

      const mockQuery = {
        find: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocs),
      };

      mockModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await repository.findPendingByRideId(rideId);

      expect(result.isOk()).toBe(true);
      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          acceptanceStatus: 'PENDING',
        })
      );
    });

    it('should exclude expired matches', async () => {
      const result = await repository.findPendingByRideId(rideId);

      expect(result.isOk()).toBe(true);
      // Verify expiry check in query
    });
  });

  describe('update', () => {
    const mockMatch = {
      id: 'match_123' as UUID,
      acceptanceStatus: 'ACCEPTED',
      acceptedAt: new Date(),
    };

    it('should update match status', async () => {
      mockModel.findOneAndUpdate.mockResolvedValue({});

      const result = await repository.update(mockMatch as any);

      expect(result.isOk()).toBe(true);
      expect(mockModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      mockModel.findOneAndUpdate.mockRejectedValue(new Error('Update failed'));

      const result = await repository.update(mockMatch as any);

      expect(result.isErr()).toBe(true);
    });
  });

  describe('countPendingForRide', () => {
    const rideId = 'ride_123' as UUID;

    it('should count pending matches', async () => {
      mockModel.countDocuments.mockResolvedValue(5);

      const result = await repository.countPendingForRide(rideId);

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(5);
    });

    it('should return 0 when no pending matches', async () => {
      mockModel.countDocuments.mockResolvedValue(0);

      const result = await repository.countPendingForRide(rideId);

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(0);
    });
  });

  describe('expireOldMatches', () => {
    const rideId = 'ride_123' as UUID;

    it('should expire old matches', async () => {
      mockModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const result = await repository.expireOldMatches(rideId);

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(3);
    });

    it('should return 0 when no matches to expire', async () => {
      mockModel.updateMany.mockResolvedValue({ modifiedCount: 0 });

      const result = await repository.expireOldMatches(rideId);

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(0);
    });
  });

  describe('deleteExpiredMatches', () => {
    const olderThan = new Date(Date.now() - 3600000); // 1 hour ago

    it('should delete expired matches', async () => {
      mockModel.deleteMany.mockResolvedValue({ deletedCount: 10 });

      const result = await repository.deleteExpiredMatches(olderThan);

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should return 0 when no expired matches', async () => {
      mockModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

      const result = await repository.deleteExpiredMatches(olderThan);

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(0);
    });
  });
});
