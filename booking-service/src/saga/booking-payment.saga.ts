import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  IBookingRepository,
  BookingCreatedEvent,
} from '@going-monorepo-clean/domains-booking-core';
import {
  IEventBus,
  SagaStatus,
} from '@going-monorepo-clean/shared-domain';

/**
 * BookingPaymentSaga - Orchestrator Pattern
 *
 * Flow:
 * 1. Client creates booking -> BookingCreatedEvent emitted
 * 2. Saga listens, calls payment-service to create PaymentIntent
 * 3. Stripe processes payment, webhook hits payment-service
 * 4. Payment-service calls back to booking-service saga endpoint
 * 5. On success -> confirm booking
 * 6. On failure -> cancel booking (compensation)
 */
@Injectable()
export class BookingPaymentSaga {
  private readonly logger = new Logger(BookingPaymentSaga.name);
  private readonly paymentServiceUrl: string;

  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
    @Inject(IEventBus)
    private readonly eventBus: IEventBus,
    private readonly config: ConfigService,
  ) {
    this.paymentServiceUrl =
      this.config.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:3001';
  }

  /**
   * Step 1: React to BookingCreatedEvent
   * Creates a payment intent via the payment-service
   */
  @OnEvent('booking.created')
  async onBookingCreated(event: BookingCreatedEvent): Promise<void> {
    const { bookingId, userId, totalAmount, totalCurrency } = event.payload;

    this.logger.log(
      `Saga started for booking ${bookingId} | status: ${SagaStatus.STARTED}`,
    );

    try {
      // Step 2: Call payment-service to create PaymentIntent
      const response = await fetch(`${this.paymentServiceUrl}/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          referenceId: bookingId,
          price: {
            amount: totalAmount,
            currency: totalCurrency,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment service returned ${response.status}`);
      }

      const data = await response.json();
      this.logger.log(
        `Payment intent created for booking ${bookingId} | clientSecret: ${data.clientSecret?.substring(0, 20)}...`,
      );
    } catch (error) {
      // Compensation: cancel the booking if payment intent fails
      this.logger.error(
        `Saga compensation triggered for booking ${bookingId}: ${error.message}`,
      );
      await this.compensateBooking(bookingId, `Payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Step 3: Handle payment success callback from payment-service
   * Confirms the booking
   */
  async onPaymentSucceeded(bookingId: string, transactionId: string): Promise<void> {
    this.logger.log(
      `Payment succeeded for booking ${bookingId} | transaction: ${transactionId}`,
    );

    const bookingResult = await this.bookingRepo.findById(bookingId);
    if (bookingResult.isErr() || !bookingResult.value) {
      this.logger.error(`Booking ${bookingId} not found during saga completion`);
      return;
    }

    const booking = bookingResult.value;
    const confirmResult = booking.confirm();

    if (confirmResult && typeof confirmResult === 'object' && 'isErr' in confirmResult) {
      if ((confirmResult as any).isErr()) {
        this.logger.error(`Cannot confirm booking ${bookingId}: invalid state`);
        return;
      }
    }

    await this.bookingRepo.update(booking);
    this.logger.log(
      `Saga completed for booking ${bookingId} | status: ${SagaStatus.COMPLETED}`,
    );
  }

  /**
   * Step 4: Handle payment failure callback from payment-service
   * Compensates by cancelling the booking
   */
  async onPaymentFailed(bookingId: string, transactionId: string): Promise<void> {
    this.logger.warn(
      `Payment failed for booking ${bookingId} | transaction: ${transactionId}`,
    );
    await this.compensateBooking(bookingId, 'Payment processing failed');
  }

  /**
   * Compensation: Cancel the booking
   */
  private async compensateBooking(bookingId: string, reason: string): Promise<void> {
    this.logger.warn(
      `Compensating booking ${bookingId} | status: ${SagaStatus.COMPENSATING}`,
    );

    const bookingResult = await this.bookingRepo.findById(bookingId);
    if (bookingResult.isErr() || !bookingResult.value) {
      this.logger.error(`Booking ${bookingId} not found during compensation`);
      return;
    }

    const booking = bookingResult.value;
    const cancelResult = booking.cancel();

    if (cancelResult && typeof cancelResult === 'object' && 'isErr' in cancelResult) {
      if ((cancelResult as any).isErr()) {
        this.logger.error(`Cannot cancel booking ${bookingId}: invalid state`);
        return;
      }
    }

    await this.bookingRepo.update(booking);
    this.logger.log(
      `Saga compensated for booking ${bookingId} | reason: ${reason} | status: ${SagaStatus.COMPENSATED}`,
    );
  }
}
