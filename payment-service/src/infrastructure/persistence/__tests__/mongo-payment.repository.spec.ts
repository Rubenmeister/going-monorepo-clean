import { Test, TestingModule } from '@nestjs/testing';
import { MongoPaymentRepository } from '../mongo-payment.repository';

describe('MongoPaymentRepository', () => {
  let repository: MongoPaymentRepository;
  let mockPaymentModel: any;

  beforeEach(async () => {
    // Mock MongoDB Model
    mockPaymentModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoPaymentRepository,
        {
          provide: 'Payment',
          useValue: mockPaymentModel,
        },
      ],
    }).compile();

    repository = module.get<MongoPaymentRepository>(MongoPaymentRepository);
  });

  describe('create', () => {
    it('should create a payment record', async () => {
      const paymentData = {
        id: 'payment-123',
        tripId: 'trip-456',
        passengerId: 'passenger-789',
        driverId: 'driver-012',
        amount: 25.5,
        platformFee: 5.1,
        driverAmount: 20.4,
        paymentMethod: 'card',
        status: 'pending',
      };

      mockPaymentModel.create.mockResolvedValue({
        paymentId: paymentData.id,
        tripId: paymentData.tripId,
        passengerId: paymentData.passengerId,
        driverId: paymentData.driverId,
        amount: paymentData.amount,
        platformFee: paymentData.platformFee,
        driverAmount: paymentData.driverAmount,
        paymentMethod: paymentData.paymentMethod,
        status: paymentData.status,
      });

      const result = await repository.create(paymentData);

      expect(mockPaymentModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.amount).toBe(25.5);
    });
  });

  describe('findById', () => {
    it('should find payment by id', async () => {
      const paymentId = 'payment-123';
      mockPaymentModel.findOne.mockResolvedValue({
        paymentId,
        amount: 25.5,
        status: 'completed',
      });

      const result = await repository.findById(paymentId);

      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({ paymentId });
      expect(result).toBeDefined();
      expect(result.amount).toBe(25.5);
    });

    it('should return null if payment not found', async () => {
      mockPaymentModel.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByTrip', () => {
    it('should find payment by trip id', async () => {
      const tripId = 'trip-456';
      mockPaymentModel.findOne.mockResolvedValue({
        tripId,
        amount: 25.5,
        status: 'completed',
      });

      const result = await repository.findByTrip(tripId);

      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({ tripId });
      expect(result).toBeDefined();
    });
  });

  describe('findByPassenger', () => {
    it('should find all payments for a passenger', async () => {
      const passengerId = 'passenger-789';
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { passengerId, amount: 25.5 },
          { passengerId, amount: 15.3 },
        ]),
      };
      mockPaymentModel.find.mockReturnValue(mockChain);

      const result = await repository.findByPassenger(passengerId);

      expect(mockPaymentModel.find).toHaveBeenCalledWith({ passengerId });
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update payment status', async () => {
      const paymentId = 'payment-123';
      mockPaymentModel.findOneAndUpdate.mockResolvedValue({
        paymentId,
        status: 'completed',
      });

      const result = await repository.update(paymentId, { status: 'completed' });

      expect(mockPaymentModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result.status).toBe('completed');
    });

    it('should throw error if payment not found', async () => {
      mockPaymentModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        repository.update('non-existent', { status: 'completed' })
      ).rejects.toThrow('Payment non-existent not found');
    });
  });

  describe('calculateDriverRevenue', () => {
    it('should calculate total driver revenue for period', async () => {
      const driverId = 'driver-012';
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      mockPaymentModel.aggregate.mockResolvedValue([
        {
          _id: null,
          totalRevenue: 500.0,
        },
      ]);

      const result = await repository.calculateDriverRevenue(driverId, startDate, endDate);

      expect(result).toBe(500.0);
    });

    it('should return 0 if no payments found', async () => {
      mockPaymentModel.aggregate.mockResolvedValue([]);

      const result = await repository.calculateDriverRevenue(
        'driver-012',
        new Date(),
        new Date()
      );

      expect(result).toBe(0);
    });
  });
});
