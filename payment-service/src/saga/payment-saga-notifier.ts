import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  PaymentSucceededEvent,
  PaymentFailedEvent,
} from '@going-monorepo-clean/domains-payment-core';

/**
 * PaymentSagaNotifier - Listens for payment domain events
 * and notifies the appropriate service saga endpoint via HTTP callback.
 *
 * Supports multiple service callbacks:
 * - booking-service (for accommodation/tour/experience bookings)
 * - transport-service (for ride requests and shipments)
 *
 * In production, this would use a message broker (Redis/RabbitMQ).
 * For now, HTTP callbacks provide the same coordination semantics.
 */
@Injectable()
export class PaymentSagaNotifier {
  private readonly logger = new Logger(PaymentSagaNotifier.name);
  private readonly bookingServiceUrl: string;
  private readonly transportServiceUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bookingServiceUrl =
      this.config.get<string>('BOOKING_SERVICE_URL') || 'http://localhost:3010';
    this.transportServiceUrl =
      this.config.get<string>('TRANSPORT_SERVICE_URL') || 'http://localhost:3006';
  }

  @OnEvent('payment.succeeded')
  async onPaymentSucceeded(event: PaymentSucceededEvent): Promise<void> {
    const { referenceId, transactionId } = event.payload;

    this.logger.log(
      `Payment succeeded for reference ${referenceId} | transaction: ${transactionId}`,
    );

    // Notify all services - each will ignore callbacks for references they don't own
    await Promise.allSettled([
      this.notifyBookingService('payment-success', referenceId as string, transactionId as string),
      this.notifyTransportRide('payment-success', referenceId as string, transactionId as string),
      this.notifyTransportShipment('payment-success', referenceId as string, transactionId as string),
    ]);
  }

  @OnEvent('payment.failed')
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    const { referenceId, transactionId } = event.payload;

    this.logger.warn(
      `Payment failed for reference ${referenceId} | transaction: ${transactionId}`,
    );

    await Promise.allSettled([
      this.notifyBookingService('payment-failure', referenceId as string, transactionId as string),
      this.notifyTransportRide('payment-failure', referenceId as string, transactionId as string),
      this.notifyTransportShipment('payment-failure', referenceId as string, transactionId as string),
    ]);
  }

  // --- Booking Service Callbacks ---

  private async notifyBookingService(
    event: 'payment-success' | 'payment-failure',
    referenceId: string,
    transactionId: string,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.bookingServiceUrl}/bookings/saga/${event}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: referenceId, transactionId }),
        },
      );
      if (!response.ok && response.status !== 404) {
        this.logger.error(`Booking callback failed: ${response.status} for ${referenceId}`);
      }
    } catch (error) {
      this.logger.warn(`Booking callback error for ${referenceId}: ${error.message}`);
    }
  }

  // --- Transport Service Callbacks (Rides) ---

  private async notifyTransportRide(
    event: 'payment-success' | 'payment-failure',
    referenceId: string,
    transactionId: string,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.transportServiceUrl}/ride-requests/saga/${event}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rideRequestId: referenceId, transactionId }),
        },
      );
      if (!response.ok && response.status !== 404) {
        this.logger.error(`Transport ride callback failed: ${response.status} for ${referenceId}`);
      }
    } catch (error) {
      this.logger.warn(`Transport ride callback error for ${referenceId}: ${error.message}`);
    }
  }

  // --- Transport Service Callbacks (Shipments) ---

  private async notifyTransportShipment(
    event: 'payment-success' | 'payment-failure',
    referenceId: string,
    transactionId: string,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.transportServiceUrl}/shipments/saga/${event}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipmentId: referenceId, transactionId }),
        },
      );
      if (!response.ok && response.status !== 404) {
        this.logger.error(`Transport shipment callback failed: ${response.status} for ${referenceId}`);
      }
    } catch (error) {
      this.logger.warn(`Transport shipment callback error for ${referenceId}: ${error.message}`);
    }
  }
}
