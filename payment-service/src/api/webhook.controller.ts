import { Controller, Post, Req, Headers, Logger, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { StripeGateway } from '../infrastructure/gateways/stripe.gateway';
import { PrismaPaymentRepository } from '../infrastructure/repositories/prisma-payment.repository';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly stripeGateway: StripeGateway,
    private readonly paymentRepository: PrismaPaymentRepository,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      const event = await this.stripeGateway.constructWebhookEvent(
        req.rawBody as Buffer,
        signature,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          await this.paymentRepository.completePayment(
            paymentIntent.metadata?.paymentId || paymentIntent.id,
            paymentIntent.id,
          );
          this.logger.log(`Payment completed: ${paymentIntent.id}`);
          break;

        case 'payment_intent.payment_failed':
          const failedIntent = event.data.object;
          this.logger.warn(`Payment failed: ${failedIntent.id}`);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      throw error;
    }
  }
}