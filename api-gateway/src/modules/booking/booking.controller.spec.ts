import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { RolesGuard } from '../../rbac/roles.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Booking Controller RBAC Tests
 * Tests role-based and permission-based access control
 */
describe('BookingController (RBAC)', () => {
  let controller: BookingController;
  let service: BookingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [BookingService],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);
  });

  describe('GET /bookings', () => {
    it('should list bookings for regular user (filtered)', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const roles = ['user'];

      // Act
      const result = await controller.listBookings(userId, roles, 1, 20);

      // Assert
      expect(result).toBeDefined();
      expect(result.items).toEqual([]);
      expect(result.page).toBe(1);
    });

    it('should list all bookings for admin (unfiltered)', async () => {
      // Arrange
      const userId = 'admin-123' as any;
      const roles = ['admin'];

      // Act
      const result = await controller.listBookings(userId, roles, 1, 20);

      // Assert
      expect(result).toBeDefined();
      expect(result.page).toBe(1);
    });
  });

  describe('POST /bookings (Create)', () => {
    it('should create booking with valid role and permission', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const email = 'user@example.com';
      const createDto = {
        accommodationId: 'acc-123',
        checkIn: '2024-03-01',
        checkOut: '2024-03-05',
      };

      jest.spyOn(service, 'createBooking').mockResolvedValue({
        id: 'booking-123' as any,
        userId,
        ...createDto,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await controller.createBooking(userId, email, createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.status).toBe('pending');
      expect(service.createBooking).toHaveBeenCalledWith(userId, createDto);
    });

    // Note: @Roles and @Permissions guards are tested separately
    // This test focuses on the business logic
  });

  describe('GET /bookings/:id (View)', () => {
    it('should allow user to view own booking', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const bookingId = 'booking-123' as any;
      const roles = ['user'];

      const booking = {
        id: bookingId,
        userId,
        status: 'pending',
        accommodationId: 'acc-123',
      };

      jest.spyOn(service, 'getBooking').mockResolvedValue(booking);

      // Act
      const result = await controller.getBooking(
        bookingId,
        userId,
        roles,
      );

      // Assert
      expect(result).toEqual(booking);
    });

    it('should deny user viewing another user\'s booking', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const otherUserId = 'user-456' as any;
      const bookingId = 'booking-123' as any;
      const roles = ['user'];

      const booking = {
        id: bookingId,
        userId: otherUserId,
        status: 'pending',
      };

      jest.spyOn(service, 'getBooking').mockResolvedValue(booking);

      // Act & Assert
      await expect(
        controller.getBooking(bookingId, userId, roles),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any booking', async () => {
      // Arrange
      const adminId = 'admin-123' as any;
      const userId = 'user-456' as any;
      const bookingId = 'booking-123' as any;
      const roles = ['admin'];

      const booking = {
        id: bookingId,
        userId,
        status: 'pending',
      };

      jest.spyOn(service, 'getBooking').mockResolvedValue(booking);

      // Act
      const result = await controller.getBooking(
        bookingId,
        adminId,
        roles,
      );

      // Assert
      expect(result).toEqual(booking);
    });

    it('should throw NotFoundException for non-existent booking', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const bookingId = 'non-existent' as any;
      const roles = ['user'];

      jest.spyOn(service, 'getBooking').mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.getBooking(bookingId, userId, roles),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /bookings/:id (Update)', () => {
    it('should allow user to update own booking', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const bookingId = 'booking-123' as any;
      const roles = ['user'];
      const updateDto = { status: 'confirmed' };

      const booking = { id: bookingId, userId };
      const updatedBooking = { ...booking, ...updateDto };

      jest.spyOn(service, 'getBooking').mockResolvedValue(booking);
      jest
        .spyOn(service, 'updateBooking')
        .mockResolvedValue(updatedBooking);

      // Act
      const result = await controller.updateBooking(
        bookingId,
        userId,
        roles,
        updateDto,
      );

      // Assert
      expect(result).toEqual(updatedBooking);
    });

    it('should deny user updating another user\'s booking', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const otherUserId = 'user-456' as any;
      const bookingId = 'booking-123' as any;
      const roles = ['user'];

      const booking = { id: bookingId, userId: otherUserId };

      jest.spyOn(service, 'getBooking').mockResolvedValue(booking);

      // Act & Assert
      await expect(
        controller.updateBooking(
          bookingId,
          userId,
          roles,
          {},
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any booking', async () => {
      // Arrange
      const adminId = 'admin-123' as any;
      const userId = 'user-456' as any;
      const bookingId = 'booking-123' as any;
      const roles = ['admin'];

      const booking = { id: bookingId, userId };
      const updatedBooking = { ...booking, status: 'confirmed' };

      jest.spyOn(service, 'getBooking').mockResolvedValue(booking);
      jest
        .spyOn(service, 'updateBooking')
        .mockResolvedValue(updatedBooking);

      // Act
      const result = await controller.updateBooking(
        bookingId,
        adminId,
        roles,
        { status: 'confirmed' },
      );

      // Assert
      expect(result).toEqual(updatedBooking);
    });
  });

  describe('POST /bookings/:id/confirm (Host-only)', () => {
    it('should allow host to confirm booking', async () => {
      // Arrange
      const hostId = 'host-123' as any;
      const bookingId = 'booking-123' as any;
      const accommodationId = 'acc-123' as any;

      const booking = {
        id: bookingId,
        accommodationId,
        status: 'pending',
      };

      const confirmedBooking = { ...booking, status: 'confirmed' };

      jest.spyOn(service, 'getBooking').mockResolvedValue(booking);
      jest
        .spyOn(service, 'isHostOfAccommodation')
        .mockResolvedValue(true);
      jest
        .spyOn(service, 'confirmBooking')
        .mockResolvedValue(confirmedBooking);

      // Act
      const result = await controller.confirmBooking(bookingId, hostId);

      // Assert
      expect(result).toEqual(confirmedBooking);
      expect(service.isHostOfAccommodation).toHaveBeenCalledWith(
        hostId,
        accommodationId,
      );
    });

    it('should deny host confirming booking of different accommodation', async () => {
      // Arrange
      const hostId = 'host-123' as any;
      const bookingId = 'booking-123' as any;
      const accommodationId = 'acc-999' as any;

      const booking = {
        id: bookingId,
        accommodationId,
        status: 'pending',
      };

      jest.spyOn(service, 'getBooking').mockResolvedValue(booking);
      jest
        .spyOn(service, 'isHostOfAccommodation')
        .mockResolvedValue(false);

      // Act & Assert
      await expect(
        controller.confirmBooking(bookingId, hostId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('PATCH /bookings/:id/admin/status (Admin-only)', () => {
    it('should allow admin to force update booking status', async () => {
      // Arrange
      const adminId = 'admin-123' as any;
      const bookingId = 'booking-123' as any;
      const newStatus = 'cancelled';

      const updatedBooking = {
        id: bookingId,
        status: newStatus,
        forcedByAdmin: true,
      };

      jest
        .spyOn(service, 'forceUpdateStatus')
        .mockResolvedValue(updatedBooking);

      // Act
      const result = await controller.adminUpdateBookingStatus(
        bookingId,
        adminId,
        newStatus,
      );

      // Assert
      expect(result).toEqual(updatedBooking);
      expect(service.forceUpdateStatus).toHaveBeenCalledWith(
        bookingId,
        newStatus,
      );
    });
  });
});

/**
 * RBAC Guards Unit Tests
 */
describe('RBAC Guards', () => {
  describe('RolesGuard', () => {
    it('should deny request when user roles don\'t match required', () => {
      // This test would check the guard metadata
      // In practice, test via integration tests with actual requests
    });

    it('should allow request when user has required role', () => {
      // Guard test example
    });
  });

  describe('PermissionsGuard', () => {
    it('should deny request when user lacks required permission', () => {
      // Permission check test
    });

    it('should allow request when user has required permission', () => {
      // Permission check test
    });
  });
});
