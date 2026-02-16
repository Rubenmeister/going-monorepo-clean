import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  PaymentSucceededEvent,
  PaymentFailedEvent,
} from '@going-monorepo-clean/domains-payment-core';

/**
 * PaymentSagaNotifier - Listens for payment domain events
 * and notifies the booking-service saga endpoint via HTTP callback.
 *
 * In production, this would use a message broker (Redis/RabbitMQ).
 * For now, HTTP callbacks provide the same coordination semantics.
 */
@Injectable()
export class PaymentSagaNotifier {
  private readonly logger = new Logger(PaymentSagaNotifier.name);
  private readonly bookingServiceUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bookingServiceUrl =
      this.config.get<string>('BOOKING_SERVICE_URL') || 'http://localhost:3010';
  }

  @OnEvent('payment.succeeded')
  async onPaymentSucceeded(event: PaymentSucceededEvent): Promise<void> {
    const { referenceId, transactionId } = event.payload;

    this.logger.log(
      `Notifying booking-service: payment succeeded for booking ${referenceId}`,
    );

    try {
      const response = await fetch(
        `${this.bookingServiceUrl}/bookings/saga/payment-success`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: referenceId,
            transactionId,
          }),
        },
      );

      if (!response.ok) {
        this.logger.error(
          `Booking-service callback failed: ${response.status} for booking ${referenceId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to notify booking-service of payment success: ${error.message}`,
      );
    }
  }

  @OnEvent('payment.failed')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    const { referenceId, transactionId } = event.payload;

    this.logger.warn(
      `Notifying booking-service: payment failed for booking ${referenceId}`,
    );

    try {
      const response = await fetch(
        `${this.bookingServiceUrl}/bookings/saga/payment-failure`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: referenceId,
            transactionId,
          }),
        },
      );

      if (!response.ok) {
        this.logger.error(
          `Booking-service callback failed: ${response.status} for booking ${referenceId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to notify booking-service of payment failure: ${error.message}`,
      );
    }
  }
}
