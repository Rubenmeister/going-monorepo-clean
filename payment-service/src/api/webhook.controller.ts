import {
  Controller,
  Post,
  Req,
  Headers,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { HandleStripeEventUseCase } from '@going-monorepo-clean/domains-payment-application';
import { Public } from '@going-monorepo-clean/shared-domain';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly handleStripeEventUseCase: HandleStripeEventUseCase,
  ) {}

  @Public()
  @Post('stripe')
  @ApiOperation({ summary: 'Webhook de Stripe para eventos de pago' })
  @ApiHeader({ name: 'stripe-signature', description: 'Firma de verificación de Stripe', required: true })
  @ApiResponse({ status: 201, description: 'Evento procesado exitosamente', schema: { properties: { received: { type: 'boolean', example: true } } } })
  @ApiResponse({ status: 400, description: 'Firma inválida o raw body faltante' })
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
}
