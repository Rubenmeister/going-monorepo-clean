import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  IRideRequestRepository,
  IShipmentRepository,
  RideCompletedEvent,
  ShipmentDeliveredEvent,
} from '@going-monorepo-clean/domains-transport-core';
import { IEventBus, SagaStatus } from '@going-monorepo-clean/shared-domain';

/**
 * TransportPaymentSaga - Orchestrator Pattern
 *
 * Handles payment flows for both ride requests and shipments.
 * Follows the same pattern as BookingPaymentSaga:
 *
 * Ride Flow:
 * 1. Ride completes -> RideCompletedEvent emitted
 * 2. Saga calls payment-service to create PaymentIntent
 * 3. Stripe processes payment, webhook hits payment-service
 * 4. Payment-service calls back to transport-service saga endpoint
 * 5. On success -> mark ride payment as paid
 * 6. On failure -> mark ride payment as failed (compensation)
 *
 * Shipment Flow:
 * 1. Shipment delivered -> ShipmentDeliveredEvent emitted
 * 2. Same flow as ride...
 */
@Injectable()
export class TransportPaymentSaga {
  private readonly logger = new Logger(TransportPaymentSaga.name);
  private readonly paymentServiceUrl: string;

  constructor(
    @Inject(IRideRequestRepository)
    private readonly rideRequestRepo: IRideRequestRepository,
    @Inject(IShipmentRepository)
    private readonly shipmentRepo: IShipmentRepository,
    @Inject(IEventBus)
    private readonly eventBus: IEventBus,
    private readonly config: ConfigService,
  ) {
    this.paymentServiceUrl =
      this.config.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:3001';
  }

  // ==========================================
  // RIDE PAYMENT SAGA
  // ==========================================

  @OnEvent('transport.ride.completed')
  async onRideCompleted(event: RideCompletedEvent): Promise<void> {
    const { rideRequestId, passengerId, totalAmountCents, totalCurrency } = event.payload;

    this.logger.log(
      `Ride payment saga started for ride ${rideRequestId} | status: ${SagaStatus.STARTED}`,
    );

    try {
      const response = await fetch(`${this.paymentServiceUrl}/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: passengerId,
          referenceId: rideRequestId,
          price: {
            amount: totalAmountCents,
            currency: totalCurrency,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment service returned ${response.status}`);
      }

      const data = await response.json();

      // Update ride with payment info
      const rideResult = await this.rideRequestRepo.findById(rideRequestId as string);
      if (rideResult.isOk() && rideResult.value) {
        const updated = rideResult.value.markPaymentPending(data.clientSecret);
        await this.rideRequestRepo.update(updated);
      }

      this.logger.log(
        `Payment intent created for ride ${rideRequestId} | clientSecret: ${data.clientSecret?.substring(0, 20)}...`,
      );
    } catch (error) {
      this.logger.error(
        `Ride payment saga failed for ${rideRequestId}: ${error.message}`,
      );
      await this.compensateRidePayment(rideRequestId as string, error.message);
    }
  }

  async onRidePaymentSucceeded(rideRequestId: string, transactionId: string): Promise<void> {
    this.logger.log(
      `Payment succeeded for ride ${rideRequestId} | transaction: ${transactionId}`,
    );

    const rideResult = await this.rideRequestRepo.findById(rideRequestId);
    if (rideResult.isErr() || !rideResult.value) {
      this.logger.error(`Ride ${rideRequestId} not found during payment confirmation`);
      return;
    }

    const updated = rideResult.value.markPaymentPaid(transactionId);
    await this.rideRequestRepo.update(updated);

    this.logger.log(
      `Ride payment saga completed for ${rideRequestId} | status: ${SagaStatus.COMPLETED}`,
    );
  }

  async onRidePaymentFailed(rideRequestId: string, transactionId: string): Promise<void> {
    this.logger.warn(
      `Payment failed for ride ${rideRequestId} | transaction: ${transactionId}`,
    );
    await this.compensateRidePayment(rideRequestId, 'Payment processing failed');
  }

  private async compensateRidePayment(rideRequestId: string, reason: string): Promise<void> {
    this.logger.warn(
      `Compensating ride payment ${rideRequestId} | status: ${SagaStatus.COMPENSATING}`,
    );

    const rideResult = await this.rideRequestRepo.findById(rideRequestId);
    if (rideResult.isErr() || !rideResult.value) {
      this.logger.error(`Ride ${rideRequestId} not found during compensation`);
      return;
    }

    const updated = rideResult.value.markPaymentFailed();
    await this.rideRequestRepo.update(updated);

    this.logger.log(
      `Ride payment compensated for ${rideRequestId} | reason: ${reason} | status: ${SagaStatus.COMPENSATED}`,
    );
  }

  // ==========================================
  // SHIPMENT PAYMENT SAGA
  // ==========================================

  @OnEvent('transport.shipment.delivered')
  async onShipmentDelivered(event: ShipmentDeliveredEvent): Promise<void> {
    const { shipmentId, senderId, amountCents, currency } = event.payload;

    this.logger.log(
      `Shipment payment saga started for shipment ${shipmentId} | status: ${SagaStatus.STARTED}`,
    );

    try {
      const response = await fetch(`${this.paymentServiceUrl}/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: senderId,
          referenceId: shipmentId,
          price: {
            amount: amountCents,
            currency,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment service returned ${response.status}`);
      }

      const data = await response.json();

      // Update shipment with payment info
      const shipmentResult = await this.shipmentRepo.findById(shipmentId as string);
      if (shipmentResult.isOk() && shipmentResult.value) {
        const updated = shipmentResult.value.markPaymentPending(data.clientSecret);
        await this.shipmentRepo.update(updated);
      }

      this.logger.log(
        `Payment intent created for shipment ${shipmentId} | clientSecret: ${data.clientSecret?.substring(0, 20)}...`,
      );
    } catch (error) {
      this.logger.error(
        `Shipment payment saga failed for ${shipmentId}: ${error.message}`,
      );
      await this.compensateShipmentPayment(shipmentId as string, error.message);
    }
  }

  async onShipmentPaymentSucceeded(shipmentId: string, transactionId: string): Promise<void> {
    this.logger.log(
      `Payment succeeded for shipment ${shipmentId} | transaction: ${transactionId}`,
    );

    const shipmentResult = await this.shipmentRepo.findById(shipmentId);
    if (shipmentResult.isErr() || !shipmentResult.value) {
      this.logger.error(`Shipment ${shipmentId} not found during payment confirmation`);
      return;
    }

    const updated = shipmentResult.value.markPaymentPaid(transactionId);
    await this.shipmentRepo.update(updated);

    this.logger.log(
      `Shipment payment saga completed for ${shipmentId} | status: ${SagaStatus.COMPLETED}`,
    );
  }

  async onShipmentPaymentFailed(shipmentId: string, transactionId: string): Promise<void> {
    this.logger.warn(
      `Payment failed for shipment ${shipmentId} | transaction: ${transactionId}`,
    );
    await this.compensateShipmentPayment(shipmentId, 'Payment processing failed');
  }

  private async compensateShipmentPayment(shipmentId: string, reason: string): Promise<void> {
    this.logger.warn(
      `Compensating shipment payment ${shipmentId} | status: ${SagaStatus.COMPENSATING}`,
    );

    const shipmentResult = await this.shipmentRepo.findById(shipmentId);
    if (shipmentResult.isErr() || !shipmentResult.value) {
      this.logger.error(`Shipment ${shipmentId} not found during compensation`);
      return;
    }

    const updated = shipmentResult.value.markPaymentFailed();
    await this.shipmentRepo.update(updated);

    this.logger.log(
      `Shipment payment compensated for ${shipmentId} | reason: ${reason} | status: ${SagaStatus.COMPENSATED}`,
    );
  }
}
