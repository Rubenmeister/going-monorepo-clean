import { RideMatch } from './ride-match.entity';
import { v4 as uuidv4 } from 'uuid';

describe('RideMatch Entity', () => {
  const rideId = uuidv4();
  const driverId = uuidv4();

  const mockDriverInfo = {
    name: 'John Doe',
    rating: 4.8,
    acceptanceRate: 0.95,
    vehicleType: 'ECONOMY',
    vehicleNumber: 'ABC123',
  };

  describe('create', () => {
    it('should create a valid ride match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const match = result.value;
        expect(match.rideId).toBe(rideId);
        expect(match.driverId).toBe(driverId);
        expect(match.distance).toBe(0.5);
        expect(match.eta).toBe(2);
        expect(match.acceptanceStatus).toBe('PENDING');
      }
    });

    it('should fail with negative distance', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: -1,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      expect(result.isErr()).toBe(true);
    });

    it('should fail with negative eta', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: -1,
        driverInfo: mockDriverInfo,
      });

      expect(result.isErr()).toBe(true);
    });

    it('should fail with invalid driver rating', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: {
          ...mockDriverInfo,
          rating: 6, // Out of range
        },
      });

      expect(result.isErr()).toBe(true);
    });

    it('should fail with invalid acceptance rate', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: {
          ...mockDriverInfo,
          acceptanceRate: 1.5, // Out of range
        },
      });

      expect(result.isErr()).toBe(true);
    });

    it('should set expiry based on TTL', () => {
      const now = new Date();
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
        ttlSeconds: 60,
      });

      if (result.isOk()) {
        const match = result.value;
        expect(match.expiresAt.getTime()).toBeGreaterThan(now.getTime());
        expect(match.expiresAt.getTime()).toBeLessThanOrEqual(
          now.getTime() + 61000
        );
      }
    });
  });

  describe('accept', () => {
    it('should accept a pending match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        const acceptResult = (match as any).accept();

        expect(acceptResult.isOk()).toBe(true);
        expect(match.acceptanceStatus).toBe('ACCEPTED');
        expect(match.acceptedAt).toBeDefined();
      }
    });

    it('should fail accepting non-pending match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        (match as any).accept();
        const secondAccept = (match as any).accept();

        expect(secondAccept.isErr()).toBe(true);
      }
    });

    it('should fail accepting expired match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
        ttlSeconds: -1, // Already expired
      });

      if (result.isOk()) {
        const match = result.value;
        const acceptResult = (match as any).accept();

        expect(acceptResult.isErr()).toBe(true);
      }
    });
  });

  describe('reject', () => {
    it('should reject a pending match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        const rejectResult = (match as any).reject();

        expect(rejectResult.isOk()).toBe(true);
        expect(match.acceptanceStatus).toBe('REJECTED');
        expect(match.rejectedAt).toBeDefined();
      }
    });

    it('should fail rejecting non-pending match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        (match as any).reject();
        const secondReject = (match as any).reject();

        expect(secondReject.isErr()).toBe(true);
      }
    });
  });

  describe('expire', () => {
    it('should expire a pending match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        const expireResult = (match as any).expire();

        expect(expireResult.isOk()).toBe(true);
        expect(match.acceptanceStatus).toBe('EXPIRED');
      }
    });
  });

  describe('isExpired', () => {
    it('should return false for new match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        expect(result.value.isExpired()).toBe(false);
      }
    });

    it('should return true for expired match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
        ttlSeconds: -1,
      });

      if (result.isOk()) {
        expect(result.value.isExpired()).toBe(true);
      }
    });
  });

  describe('isPending', () => {
    it('should return true for new pending match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        expect(result.value.isPending()).toBe(true);
      }
    });

    it('should return false after acceptance', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        (match as any).accept();
        expect(match.isPending()).toBe(false);
      }
    });
  });

  describe('isAccepted', () => {
    it('should return true for accepted match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        (match as any).accept();
        expect(match.isAccepted()).toBe(true);
      }
    });

    it('should return false for pending match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        expect(result.value.isAccepted()).toBe(false);
      }
    });
  });

  describe('isRejected', () => {
    it('should return true for rejected match', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        (match as any).reject();
        expect(match.isRejected()).toBe(true);
      }
    });
  });

  describe('validateDistance', () => {
    it('should validate distance is within max radius', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 2.5,
        eta: 5,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        expect(match.validateDistance(5)).toBe(true);
        expect(match.validateDistance(2)).toBe(false);
      }
    });
  });

  describe('toPrimitives and fromPrimitives', () => {
    it('should convert to primitives and back', () => {
      const result = RideMatch.create({
        rideId,
        driverId,
        distance: 0.5,
        eta: 2,
        driverInfo: mockDriverInfo,
      });

      if (result.isOk()) {
        const match = result.value;
        const primitives = match.toPrimitives();
        const restored = RideMatch.fromPrimitives(primitives);

        expect(restored.id).toBe(match.id);
        expect(restored.rideId).toBe(match.rideId);
        expect(restored.driverId).toBe(match.driverId);
        expect(restored.distance).toBe(match.distance);
      }
    });
  });
});
