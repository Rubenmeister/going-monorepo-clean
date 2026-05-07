import {
  Controller,
  Post,
  Req,
  Headers,
  RawBodyRequest,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { HandleStripeEventUseCase } from '@going-monorepo-clean/domains-payment-application';
import { MercadoPagoGateway } from '../infrastructure/gateways/mercadopago.gateway';
import { DatafastGateway } from '../infrastructure/gateways/datafast.gateway';
import { DeunaGateway } from '../infrastructure/gateways/deuna.gateway';
import { IPaymentRepository } from '../domain/ports';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly handleStripeEventUseCase: HandleStripeEventUseCase,
    private readonly mercadoPagoGateway: MercadoPagoGateway,
    private readonly datafastGateway: DatafastGateway,
    private readonly deunaGateway: DeunaGateway,
    @Inject(IPaymentRepository)
    private readonly paymentRepository: IPaymentRepository,
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
        await this.handleDatafastPaymentApproved(event);
      } else if (event.status === 'rejected' || event.status === 'failed') {
        this.logger.warn(`Datafast pago rechazado: ${event.transactionId}`);
        await this.handleDatafastPaymentFailed(event);
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
        await this.handleDeunaPaymentApproved(event);
      } else if (event.status === 'expired' || event.status === 'cancelled') {
        this.logger.warn(`DeUna orden ${event.status}: ${event.orderId}`);
        await this.handleDeunaPaymentFailed(event);
      }
    } else {
      this.logger.log(`DeUna webhook (sin firma): ${JSON.stringify(req.body)}`);
    }

    return { received: true };
  }

  /**
   * Handle approved Datafast payment
   * Finds the payment record by tripId (from event metadata) and updates status to completed
   */
  private async handleDatafastPaymentApproved(event: any): Promise<void> {
    try {
      const tripId = event.metadata?.tripId || event.orderId;
      if (!tripId) {
        this.logger.warn('Datafast approved event missing tripId/orderId metadata');
        return;
      }

      // Find payment by tripId
      const payment = await this.paymentRepository.findByTrip(tripId);
      if (!payment) {
        this.logger.warn(`No payment found for Datafast tripId: ${tripId}`);
        return;
      }

      // Update payment status to completed
      await this.paymentRepository.update(payment.id, {
        status: 'completed',
        transactionId: event.transactionId || event.sessionId,
        completedAt: new Date(),
      });

      this.logger.log(
        `Payment ${payment.id} marked as completed for tripId ${tripId}`,
      );

      // Notify billing service to update invoice
      const billingUrl = process.env.BILLING_SERVICE_URL || 'http://localhost:3008';
      fetch(`${billingUrl}/internal/payment-completed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          amount: payment.amount || 0,
          method: payment.method || 'datafast',
          transactionId: event.transactionId || event.sessionId,
        }),
      }).catch(e => this.logger.warn(`Billing notification failed: ${e.message}`));

      // Notify envios-service — la referencia podría ser un parcelId. envios
      // detecta si conoce el ID o ignora silenciosamente.
      this.notifyEnviosService(tripId, 'succeeded');
    } catch (error) {
      this.logger.error(
        `Error handling Datafast approved payment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Handle failed/rejected Datafast payment
   * Finds the payment record and updates status to failed
   */
  private async handleDatafastPaymentFailed(event: any): Promise<void> {
    try {
      const tripId = event.metadata?.tripId || event.orderId;
      if (!tripId) {
        this.logger.warn('Datafast failed event missing tripId/orderId metadata');
        return;
      }

      // Find payment by tripId
      const payment = await this.paymentRepository.findByTrip(tripId);
      if (!payment) {
        this.logger.warn(`No payment found for Datafast tripId: ${tripId}`);
        return;
      }

      // Update payment status to failed
      await this.paymentRepository.update(payment.id, {
        status: 'failed',
        failureReason:
          event.errorMessage || event.reason || 'Payment declined by provider',
      });

      this.logger.warn(
        `Payment ${payment.id} marked as failed for tripId ${tripId}. Reason: ${event.errorMessage}`,
      );

      // Notify envios-service por si la referencia era un parcel.
      this.notifyEnviosService(tripId, 'failed');

      // TODO: Call transport service HTTP endpoint to cancel/revert ride
      // POST to TRANSPORT_SERVICE_URL/api/rides/{tripId}/payment-failed
      // or implement event emission for async processing
    } catch (error) {
      this.logger.error(
        `Error handling Datafast failed payment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Notifica a envios-service cuando un pago cambió de estado.
   * Si la referenceId no es un parcel (ej. es un tripId), envios devuelve 200
   * silenciosamente sin tocar nada (su webhook handler lo ignora).
   *
   * Best-effort: errors no se propagan, solo se logean.
   */
  private notifyEnviosService(parcelId: string, status: 'succeeded' | 'failed'): void {
    const enviosUrl = process.env.ENVIOS_SERVICE_URL || 'http://localhost:3010';
    fetch(`${enviosUrl}/parcels/webhooks/payment-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelId, status }),
    }).catch((e) =>
      this.logger.warn(`Envios payment notification failed: ${e.message}`),
    );
  }

  /**
   * Handle approved DeUna payment
   * Finds the payment record by orderId and updates status to completed
   */
  private async handleDeunaPaymentApproved(event: any): Promise<void> {
    try {
      const orderId = event.orderId;
      if (!orderId) {
        this.logger.warn('DeUna approved event missing orderId');
        return;
      }

      // Find payment by tripId (orderId should match)
      const payment = await this.paymentRepository.findByTrip(orderId);
      if (!payment) {
        this.logger.warn(`No payment found for DeUna orderId: ${orderId}`);
        return;
      }

      // Update payment status to completed
      await this.paymentRepository.update(payment.id, {
        status: 'completed',
        transactionId: event.transactionId || event.orderId,
        completedAt: new Date(),
      });

      this.logger.log(
        `Payment ${payment.id} marked as completed for DeUna orderId ${orderId}`,
      );

      // Notify billing service to update invoice
      const billingUrl = process.env.BILLING_SERVICE_URL || 'http://localhost:3008';
      fetch(`${billingUrl}/internal/payment-completed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: orderId,
          amount: payment.amount || 0,
          method: payment.method || 'deuna',
          transactionId: event.transactionId || event.orderId,
        }),
      }).catch(e => this.logger.warn(`Billing notification failed: ${e.message}`));

      // Notify envios-service — orderId podría ser parcelId.
      this.notifyEnviosService(orderId, 'succeeded');
    } catch (error) {
      this.logger.error(
        `Error handling DeUna approved payment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Handle failed/expired/cancelled DeUna payment
   * Finds the payment record and updates status to failed
   */
  private async handleDeunaPaymentFailed(event: any): Promise<void> {
    try {
      const orderId = event.orderId;
      if (!orderId) {
        this.logger.warn('DeUna failed event missing orderId');
        return;
      }

      // Find payment by tripId (orderId should match)
      const payment = await this.paymentRepository.findByTrip(orderId);
      if (!payment) {
        this.logger.warn(`No payment found for DeUna orderId: ${orderId}`);
        return;
      }

      // Update payment status to failed
      await this.paymentRepository.update(payment.id, {
        status: 'failed',
        failureReason:
          event.reason || event.status === 'cancelled'
            ? 'Payment cancelled by user'
            : 'Payment expired or declined',
      });

      this.logger.warn(
        `Payment ${payment.id} marked as failed for DeUna orderId ${orderId}. Reason: ${event.status}`,
      );

      // Notify envios-service por si el orderId era un parcel.
      this.notifyEnviosService(orderId, 'failed');

      // TODO: Call transport service HTTP endpoint to cancel/revert ride
      // POST to TRANSPORT_SERVICE_URL/api/rides/{orderId}/payment-failed
      // or implement event emission for async processing
    } catch (error) {
      this.logger.error(
        `Error handling DeUna failed payment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
