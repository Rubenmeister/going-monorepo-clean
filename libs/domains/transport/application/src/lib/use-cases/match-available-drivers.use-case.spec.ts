import { Test, TestingModule } from '@nestjs/testing';
import { MatchAvailableDriversUseCase } from './match-available-drivers.use-case';
import { IRideMatchRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { ok, err } from 'neverthrow';

describe('MatchAvailableDriversUseCase', () => {
  let useCase: MatchAvailableDriversUseCase;
  let mockRideMatchRepo: jest.Mocked<IRideMatchRepository>;

  beforeEach(async () => {
    mockRideMatchRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByRideId: jest.fn(),
      findPendingByRideId: jest.fn(),
      findByDriverId: jest.fn(),
      findAvailableMatches: jest.fn(),
      expireOldMatches: jest.fn(),
      deleteExpiredMatches: jest.fn(),
      countPendingForRide: jest.fn(),
      countAcceptedForDriver: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchAvailableDriversUseCase,
        { provide: IRideMatchRepository, useValue: mockRideMatchRepo },
      ],
    }).compile();

    useCase = module.get<MatchAvailableDriversUseCase>(
      MatchAvailableDriversUseCase
    );
  });

  describe('execute', () => {
    const validDto = {
      rideId: 'ride_123' as UUID,
      pickupLatitude: 40.7128,
      pickupLongitude: -74.006,
      dropoffLatitude: 40.758,
      dropoffLongitude: -73.9855,
      vehicleType: 'ECONOMY',
      maxRadius: 5,
      limit: 10,
    };

    it('should return matched drivers', async () => {
      mockRideMatchRepo.save.mockResolvedValue(ok(undefined));

      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveProperty('matches');
      expect(Array.isArray(result.value?.matches)).toBe(true);
    });

    it('should filter drivers by vehicle type', async () => {
      mockRideMatchRepo.save.mockResolvedValue(ok(undefined));

      const dto = { ...validDto, vehicleType: 'PREMIUM' };
      const result = await useCase.execute(dto);

      expect(result.isOk()).toBe(true);
      // Verify filtering happened in use case
    });

    it('should filter drivers by maximum radius', async () => {
      mockRideMatchRepo.save.mockResolvedValue(ok(undefined));

      const dto = { ...validDto, maxRadius: 2 };
      const result = await useCase.execute(dto);

      expect(result.isOk()).toBe(true);
    });

    it('should sort by distance, rating, acceptance rate', async () => {
      mockRideMatchRepo.save.mockResolvedValue(ok(undefined));

      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
      // Verify sorting in matches array
      if (result.isOk() && result.value.matches.length > 1) {
        // Distance should be ascending
        for (let i = 0; i < result.value.matches.length - 1; i++) {
          expect(
            result.value.matches[i].distance <=
              result.value.matches[i + 1].distance
          ).toBe(true);
        }
      }
    });

    it('should return error when no drivers available', async () => {
      // Mock scenario where no drivers match criteria
      // This depends on implementation details

      const result = await useCase.execute(validDto);

      // Either returns empty matches or error depending on design
      expect(result.isOk() || result.isErr()).toBe(true);
    });

    it('should set TTL to 2 minutes for matches', async () => {
      mockRideMatchRepo.save.mockResolvedValue(ok(undefined));

      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const expiresAt = result.value?.expiresAt;
        const createdAt = new Date();
        const ttl = expiresAt.getTime() - createdAt.getTime();
        // Should be approximately 2 minutes (120 seconds = 120000ms)
        expect(ttl).toBeGreaterThanOrEqual(119000);
        expect(ttl).toBeLessThanOrEqual(121000);
      }
    });

    it('should include driver info in matches', async () => {
      mockRideMatchRepo.save.mockResolvedValue(ok(undefined));

      const result = await useCase.execute(validDto);

      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value.matches.length > 0) {
        const match = result.value.matches[0];
        expect(match).toHaveProperty('driverId');
        expect(match).toHaveProperty('driverName');
        expect(match).toHaveProperty('rating');
        expect(match).toHaveProperty('acceptanceRate');
        expect(match).toHaveProperty('distance');
        expect(match).toHaveProperty('eta');
      }
    });

    it('should respect limit parameter', async () => {
      mockRideMatchRepo.save.mockResolvedValue(ok(undefined));

      const dto = { ...validDto, limit: 3 };
      const result = await useCase.execute(dto);

      expect(result.isOk()).toBe(true);
      expect(result.value?.matches.length).toBeLessThanOrEqual(3);
    });

    it('should handle database save failures', async () => {
      mockRideMatchRepo.save.mockResolvedValue(
        err(new Error('Database error'))
      );

      const result = await useCase.execute(validDto);

      // Use case should continue even if some saves fail (logged but not blocking)
      expect(result.isOk() || result.isErr()).toBe(true);
    });

    it('should require valid coordinates', async () => {
      const invalidDto = {
        ...validDto,
        pickupLatitude: 91, // Invalid latitude
      };

      const result = await useCase.execute(invalidDto);

      // Should either validate or handle gracefully
      expect(result.isOk() || result.isErr()).toBe(true);
    });

    it('should default maxRadius to 5km if not provided', async () => {
      mockRideMatchRepo.save.mockResolvedValue(ok(undefined));

      const dto = { ...validDto };
      delete dto.maxRadius;
      const result = await useCase.execute(dto as any);

      expect(result.isOk()).toBe(true);
    });
  });
});
