import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPaymentUseCase } from '../process-payment.use-case';
import { StripeGateway } from '../../infrastructure/gateways/stripe.gateway';

describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let mockPaymentRepository: any;
  let mockStripeGateway: any;

  beforeEach(async () => {
    mockPaymentRepository = {
      create: jest.fn(),
      update: jest.fn(),
    };

    mockStripeGateway = {
      processPayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentUseCase,
        {
          provide: 'IPaymentRepository',
          useValue: mockPaymentRepository,
        },
        {
          provide: StripeGateway,
          useValue: mockStripeGateway,
        },
      ],
    }).compile();

    useCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
  });

  describe('execute', () => {
    it('should process card payment successfully', async () => {
      const input = {
        tripId: 'trip-123',
        passengerId: 'passenger-456',
        driverId: 'driver-789',
        amount: 25.5,
        paymentMethod: 'card' as const,
        paymentMethodId: 'pm_test123',
      };

      mockPaymentRepository.create.mockResolvedValue({
        id: 'payment-001',
        ...input,
        status: 'pending',
      });

      mockStripeGateway.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'pi_test123',
      });

      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-001',
        ...input,
        status: 'completed',
        transactionId: 'pi_test123',
      });

      const result = await useCase.execute(input);

      expect(mockPaymentRepository.create).toHaveBeenCalled();
      expect(mockStripeGateway.processPayment).toHaveBeenCalled();
      expect(mockPaymentRepository.update).toHaveBeenCalledWith(
        'payment-001',
        expect.objectContaining({
          status: 'completed',
          transactionId: 'pi_test123',
        })
      );
      expect(result.status).toBe('completed');
    });

    it('should process cash payment without Stripe', async () => {
      const input = {
        tripId: 'trip-123',
        passengerId: 'passenger-456',
        driverId: 'driver-789',
        amount: 25.5,
        paymentMethod: 'cash' as const,
      };

      mockPaymentRepository.create.mockResolvedValue({
        id: 'payment-002',
        ...input,
        status: 'pending',
      });

      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-002',
        ...input,
        status: 'completed',
      });

      const result = await useCase.execute(input);

      expect(mockStripeGateway.processPayment).not.toHaveBeenCalled();
      expect(result.status).toBe('completed');
    });

    it('should process wallet payment without Stripe', async () => {
      const input = {
        tripId: 'trip-123',
        passengerId: 'passenger-456',
        driverId: 'driver-789',
        amount: 25.5,
        paymentMethod: 'wallet' as const,
      };

      mockPaymentRepository.create.mockResolvedValue({
        id: 'payment-003',
        ...input,
        status: 'pending',
      });

      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-003',
        ...input,
        status: 'completed',
      });

      const result = await useCase.execute(input);

      expect(mockStripeGateway.processPayment).not.toHaveBeenCalled();
      expect(result.status).toBe('completed');
    });

    it('should handle Stripe payment failure', async () => {
      const input = {
        tripId: 'trip-123',
        passengerId: 'passenger-456',
        driverId: 'driver-789',
        amount: 25.5,
        paymentMethod: 'card' as const,
        paymentMethodId: 'pm_test123',
      };

      mockPaymentRepository.create.mockResolvedValue({
        id: 'payment-004',
        ...input,
        status: 'pending',
      });

      mockStripeGateway.processPayment.mockResolvedValue({
        success: false,
        error: 'Card declined',
      });

      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-004',
        ...input,
        status: 'failed',
        failureReason: 'Card declined',
      });

      await expect(useCase.execute(input)).rejects.toThrow('Card declined');
    });

    it('should calculate correct fees (20% platform, 80% driver)', async () => {
      const input = {
        tripId: 'trip-123',
        passengerId: 'passenger-456',
        driverId: 'driver-789',
        amount: 100,
        paymentMethod: 'cash' as const,
      };

      mockPaymentRepository.create.mockResolvedValue({
        id: 'payment-005',
        ...input,
        platformFee: 20,
        driverAmount: 80,
        status: 'pending',
      });

      mockPaymentRepository.update.mockResolvedValue({
        id: 'payment-005',
        ...input,
        platformFee: 20,
        driverAmount: 80,
        status: 'completed',
      });

      await useCase.execute(input);

      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          platformFee: 20,
          driverAmount: 80,
        })
      );
    });
  });
});
