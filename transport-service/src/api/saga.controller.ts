import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@going-monorepo-clean/shared-domain';
import { TransportPaymentSaga } from '../saga/transport-payment.saga';

class RidePaymentCallbackDto {
  rideRequestId: string;
  transactionId: string;
}

class ShipmentPaymentCallbackDto {
  shipmentId: string;
  transactionId: string;
}

/**
 * Saga callback endpoints for cross-service payment coordination.
 * Called by payment-service when Stripe webhook fires.
 *
 * Follows the same pattern as booking-service's SagaController.
 */
@ApiTags('saga')
@Controller()
export class TransportSagaController {
  private readonly logger = new Logger(TransportSagaController.name);

  constructor(private readonly transportPaymentSaga: TransportPaymentSaga) {}

  // ==========================================
  // RIDE REQUEST PAYMENT CALLBACKS
  // ==========================================

  @Post('ride-requests/saga/payment-success')
  @Public()
  @ApiOperation({ summary: 'Callback: payment succeeded for a ride request' })
  async onRidePaymentSuccess(@Body() dto: RidePaymentCallbackDto) {
    this.logger.log(
      `Ride payment success callback received for ride ${dto.rideRequestId}`,
    );
    await this.transportPaymentSaga.onRidePaymentSucceeded(
      dto.rideRequestId,
      dto.transactionId,
    );
    return { status: 'ride_payment_confirmed', rideRequestId: dto.rideRequestId };
  }

  @Post('ride-requests/saga/payment-failure')
  @Public()
  @ApiOperation({ summary: 'Callback: payment failed for a ride request' })
  async onRidePaymentFailure(@Body() dto: RidePaymentCallbackDto) {
    this.logger.warn(
      `Ride payment failure callback received for ride ${dto.rideRequestId}`,
    );
    await this.transportPaymentSaga.onRidePaymentFailed(
      dto.rideRequestId,
      dto.transactionId,
    );
    return { status: 'ride_payment_failed', rideRequestId: dto.rideRequestId };
  }

  // ==========================================
  // SHIPMENT PAYMENT CALLBACKS
  // ==========================================

  @Post('shipments/saga/payment-success')
  @Public()
  @ApiOperation({ summary: 'Callback: payment succeeded for a shipment' })
  async onShipmentPaymentSuccess(@Body() dto: ShipmentPaymentCallbackDto) {
    this.logger.log(
      `Shipment payment success callback received for shipment ${dto.shipmentId}`,
    );
    await this.transportPaymentSaga.onShipmentPaymentSucceeded(
      dto.shipmentId,
      dto.transactionId,
    );
    return { status: 'shipment_payment_confirmed', shipmentId: dto.shipmentId };
  }

  @Post('shipments/saga/payment-failure')
  @Public()
  @ApiOperation({ summary: 'Callback: payment failed for a shipment' })
  async onShipmentPaymentFailure(@Body() dto: ShipmentPaymentCallbackDto) {
    this.logger.warn(
      `Shipment payment failure callback received for shipment ${dto.shipmentId}`,
    );
    await this.transportPaymentSaga.onShipmentPaymentFailed(
      dto.shipmentId,
      dto.transactionId,
    );
    return { status: 'shipment_payment_failed', shipmentId: dto.shipmentId };
  }
}
