import { Injectable, Inject } from '@nestjs/common';
import { IPaymentRepository, IPayoutRepository } from '../../domain/ports';
import { ProcessPaymentUseCase } from './process-payment.use-case';
import { v4 as uuidv4 } from 'uuid';

/**
 * Complete Ride Use Case
 * Completes a ride and processes associated payment
 */
@Injectable()
export class CompleteRideUseCase {
  constructor(
    @Inject(IPaymentRepository) private paymentRepository: IPaymentRepository,
    @Inject(IPayoutRepository) private payoutRepository: IPayoutRepository,
    private processPaymentUseCase: ProcessPaymentUseCase
  ) {}

  async execute(input: {
    tripId: string;
    passengerId: string;
    driverId: string;
    finalFare: number;
    actualDistance: number;
    actualDuration: number;
    paymentMethod: 'card' | 'wallet' | 'cash';
    paymentMethodId?: string;
  }): Promise<{
    payment: any;
    completion: {
      tripId: string;
      finalFare: number;
      driverEarnings: number;
      platformRevenue: number;
      completedAt: Date;
    };
  }> {
    // Process the payment
    const payment = await this.processPaymentUseCase.execute({
      tripId: input.tripId,
      passengerId: input.passengerId,
      driverId: input.driverId,
      amount: input.finalFare,
      paymentMethod: input.paymentMethod,
      paymentMethodId: input.paymentMethodId,
    });

    if (!payment || payment.status !== 'completed') {
      throw new Error('Payment processing failed');
    }

    // Create or update driver payout entry
    await this.recordDriverPayout(input.driverId, payment);

    return {
      payment,
      completion: {
        tripId: input.tripId,
        finalFare: input.finalFare,
        driverEarnings: payment.driverAmount,
        platformRevenue: payment.platformFee,
        completedAt: new Date(),
      },
    };
  }

  private async recordDriverPayout(
    driverId: string,
    payment: any
  ): Promise<void> {
    try {
      // Get current date for payout period (weekly)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Check if payout already exists for this period
      const existingPayout = await this.payoutRepository.findByDriverAndPeriod(
        driverId,
        weekStart,
        weekEnd
      );

      if (existingPayout) {
        // Update existing payout
        await this.payoutRepository.update(existingPayout.id, {
          amount: existingPayout.amount + payment.driverAmount,
          netAmount:
            existingPayout.netAmount +
            payment.driverAmount -
            (existingPayout.fees || 0),
          transactionCount: existingPayout.transactionCount + 1,
          transactionIds: [
            ...(existingPayout.transactionIds || []),
            payment.id,
          ],
        });
      } else {
        // Create new payout for the week
        const payoutId = uuidv4();
        await this.payoutRepository.create({
          id: payoutId,
          driverId,
          amount: payment.driverAmount,
          currency: 'USD',
          status: 'pending',
          paymentMethod: 'bank_account',
          periodStart: weekStart,
          periodEnd: weekEnd,
          transactionCount: 1,
          transactionIds: [payment.id],
          fees: 0,
          netAmount: payment.driverAmount,
        });
      }
    } catch (error) {
      // Log error but don't fail the ride completion
      console.error(`Failed to record payout for driver ${driverId}:`, error);
    }
  }
}
