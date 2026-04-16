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
import { DatafastGateway } from '../infrastructure/gateways/datafast.gateway';
import { DeunaGateway } from '../infrastructure/gateways/deuna.gateway';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly handleStripeEventUseCase: HandleStripeEventUseCase,
    private readonly mercadoPagoGateway: MercadoPagoGateway,
    private readonly datafastGateway: DatafastGateway,
    private readonly deunaGateway: DeunaGateway,
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

  /**
   * POST /webhooks/datafast
   * Datafast envía el resultado del pago con firma HMAC-SHA256
   * Header: X-Datafast-Signature
   */
  @Post('datafast')
  async handleDatafastWebhook(
    @Headers('x-datafast-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const body = req.rawBody ?? Buffer.from(JSON.stringify(req.body));

    if (signature) {
      const eventResult = await this.datafastGateway.constructWebhookEvent(body, signature);
      if (eventResult.isErr()) {
        this.logger.warn(`Datafast webhook inválido: ${eventResult.error.message}`);
        throw new BadRequestException(eventResult.error.message);
      }

      const event = eventResult.value;
      this.logger.log(`Datafast evento: ${JSON.stringify(event)}`);

      // Manejar resultado del pago
      if (event.status === 'approved' || event.status === 'paid') {
        this.logger.log(`Datafast pago aprobado: ${event.transactionId ?? event.sessionId}`);
        // TODO: disparar use-case para marcar viaje como pagado
      } else if (event.status === 'rejected' || event.status === 'failed') {
        this.logger.warn(`Datafast pago rechazado: ${event.transactionId}`);
        // TODO: disparar use-case para revertir reserva
      }
    } else {
      this.logger.log(`Datafast webhook (sin firma): ${JSON.stringify(req.body)}`);
    }

    return { received: true };
  }

  /**
   * POST /webhooks/deuna
   * DeUna confirma el pago con firma HMAC-SHA256
   * Header: X-DeUna-Signature
   */
  @Post('deuna')
  async handleDeunaWebhook(
    @Headers('x-deuna-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const body = req.rawBody ?? Buffer.from(JSON.stringify(req.body));

    if (signature) {
      const eventResult = await this.deunaGateway.constructWebhookEvent(body, signature);
      if (eventResult.isErr()) {
        this.logger.warn(`DeUna webhook inválido: ${eventResult.error.message}`);
        throw new BadRequestException(eventResult.error.message);
      }

      const event = eventResult.value;
      this.logger.log(`DeUna evento: ${JSON.stringify(event)}`);

      // Estados DeUna: pending | paid | expired | cancelled
      if (event.status === 'paid') {
        this.logger.log(`DeUna pago confirmado: ${event.orderId}`);
        // TODO: disparar use-case para marcar viaje como pagado
      } else if (event.status === 'expired' || event.status === 'cancelled') {
        this.logger.warn(`DeUna orden ${event.status}: ${event.orderId}`);
        // TODO: disparar use-case para revertir reserva
      }
    } else {
      this.logger.log(`DeUna webhook (sin firma): ${JSON.stringify(req.body)}`);
    }

    return { received: true };
  }
}
