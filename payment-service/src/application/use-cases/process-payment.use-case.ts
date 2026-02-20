import { Injectable } from '@nestjs/common';
import { IPaymentRepository } from '../../domain/ports';
import { StripeGateway } from '../../infrastructure/gateways/stripe.gateway';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process Payment Use Case
 * Processes payment for a completed ride
 */
@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    private paymentRepository: IPaymentRepository,
    private stripeGateway: StripeGateway
  ) {}

  async execute(input: {
    tripId: string;
    passengerId: string;
    driverId: string;
    amount: number;
    paymentMethod: 'card' | 'wallet' | 'cash';
    paymentMethodId?: string;
  }): Promise<any> {
    // Calculate fees
    const platformFee = Math.round(input.amount * 0.2 * 100) / 100;
    const driverAmount = Math.round(input.amount * 0.8 * 100) / 100;

    // Create payment record
    const paymentId = uuidv4();
    const payment = await this.paymentRepository.create({
      id: paymentId,
      tripId: input.tripId,
      passengerId: input.passengerId,
      driverId: input.driverId,
      amount: input.amount,
      platformFee,
      driverAmount,
      paymentMethod: input.paymentMethod,
      status: 'pending',
      createdAt: new Date(),
    });

    // Skip Stripe processing for cash and wallet payments
    if (input.paymentMethod === 'cash' || input.paymentMethod === 'wallet') {
      return await this.paymentRepository.update(payment.id, {
        status: 'completed',
        completedAt: new Date(),
      });
    }

    // Process card payment with Stripe
    if (input.paymentMethod === 'card' && input.paymentMethodId) {
      const result = await this.stripeGateway.processPayment({
        amount: Math.round(input.amount * 100), // Convert to cents
        currency: 'USD',
        customerId: input.passengerId,
        paymentMethodId: input.paymentMethodId,
        description: `Payment for trip ${input.tripId}`,
        metadata: {
          tripId: input.tripId,
          driverId: input.driverId,
        },
      });

      if (result.success && result.transactionId) {
        return await this.paymentRepository.update(payment.id, {
          status: 'completed',
          transactionId: result.transactionId,
          completedAt: new Date(),
        });
      } else {
        await this.paymentRepository.update(payment.id, {
          status: 'failed',
          failureReason: result.error || 'Payment processing failed',
        });

        throw new Error(result.error || 'Payment processing failed');
      }
    }

    throw new Error('Invalid payment method');
  }
}
