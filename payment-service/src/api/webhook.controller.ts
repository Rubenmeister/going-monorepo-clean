import {
  Controller,
  Post,
  Req,
  Headers,
  RawBodyRequest,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { HandleStripeEventUseCase } from '@going-monorepo-clean/domains-payment-application';
import { MercadoPagoGateway } from '../infrastructure/gateways/mercadopago.gateway';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly handleStripeEventUseCase: HandleStripeEventUseCase,
    private readonly mercadoPagoGateway: MercadoPagoGateway,
  ) {}

  /**
   * POST /webhooks/stripe
   * Stripe sends the raw body + stripe-signature header
   */
  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    if (!req.rawBody) {
      throw new BadRequestException('Raw body missing. Ensure rawBody: true in main.ts');
    }

    try {
      await this.handleStripeEventUseCase.execute(req.rawBody, signature);
      return { received: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * POST /webhooks/mercadopago
   * MercadoPago sends JSON body + x-signature header
   * https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
   */
  @Post('mercadopago')
  async handleMercadoPagoWebhook(
    @Headers('x-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const body = req.rawBody ?? Buffer.from(JSON.stringify(req.body));

    // Signature is optional (MP doesn't always send it in sandbox)
    if (signature) {
      const eventResult = await this.mercadoPagoGateway.constructWebhookEvent(
        body,
        signature,
      );
      if (eventResult.isErr()) {
        this.logger.warn(`MP webhook verification failed: ${eventResult.error.message}`);
        throw new BadRequestException(eventResult.error.message);
      }

      const event = eventResult.value;
      this.logger.log(`MercadoPago event: ${event.type} / action: ${event.action}`);
      // Handle specific events
      if (event.action === 'payment.updated' || event.type === 'payment') {
        const mpPaymentId = event.data?.id;
        if (mpPaymentId) {
          const statusResult = await this.mercadoPagoGateway.getPaymentStatus(String(mpPaymentId));
          if (statusResult.isOk()) {
            this.logger.log(`MP payment ${mpPaymentId} status: ${statusResult.value}`);
          }
        }
      }
    } else {
      // No signature — log the event for debugging
      this.logger.log(`MP webhook (no signature): ${JSON.stringify(req.body)}`);
    }

    return { received: true };
  }
}
