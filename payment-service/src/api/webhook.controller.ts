import {
  Controller,
  Post,
  Req,
  Headers,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { HandleStripeEventUseCase } from '@going-monorepo-clean/domains-payment-application';

@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly handleStripeEventUseCase: HandleStripeEventUseCase,
  ) {}

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
}