import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@going-monorepo-clean/shared-domain';
import { BookingPaymentSaga } from '../saga/booking-payment.saga';

class PaymentCallbackDto {
  bookingId: string;
  transactionId: string;
}

/**
 * Saga callback endpoints for cross-service communication.
 * Called by payment-service when Stripe webhook fires.
 *
 * In production, these would be replaced by message broker consumers.
 * For now, HTTP callbacks provide the same coordination semantics.
 */
@ApiTags('saga')
@Controller('bookings/saga')
export class SagaController {
  private readonly logger = new Logger(SagaController.name);

  constructor(private readonly bookingPaymentSaga: BookingPaymentSaga) {}

  @Post('payment-success')
  @Public()
  @ApiOperation({ summary: 'Callback: payment succeeded for a booking' })
  async onPaymentSuccess(@Body() dto: PaymentCallbackDto) {
    this.logger.log(
      `Payment success callback received for booking ${dto.bookingId}`,
    );
    await this.bookingPaymentSaga.onPaymentSucceeded(
      dto.bookingId,
      dto.transactionId,
    );
    return { status: 'booking_confirmed', bookingId: dto.bookingId };
  }

  @Post('payment-failure')
  @Public()
  @ApiOperation({ summary: 'Callback: payment failed for a booking' })
  async onPaymentFailure(@Body() dto: PaymentCallbackDto) {
    this.logger.warn(
      `Payment failure callback received for booking ${dto.bookingId}`,
    );
    await this.bookingPaymentSaga.onPaymentFailed(
      dto.bookingId,
      dto.transactionId,
    );
    return { status: 'booking_cancelled', bookingId: dto.bookingId };
  }
}
