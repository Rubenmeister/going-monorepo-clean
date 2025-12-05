import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { PrismaPaymentRepository } from '../infrastructure/repositories/prisma-payment.repository';
import { StripeGateway } from '../infrastructure/gateways/stripe.gateway';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentRepository: PrismaPaymentRepository,
    private readonly stripeGateway: StripeGateway,
  ) {}

  @Post()
  async createPayment(@Body() body: {
    userId: string;
    amount: number;
    currency?: string;
    bookingId?: string;
    parcelId?: string;
    method?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH';
  }) {
    // Create payment record
    const payment = await this.paymentRepository.createPayment({
      userId: body.userId,
      amount: body.amount,
      currency: body.currency || 'USD',
      bookingId: body.bookingId,
      parcelId: body.parcelId,
      method: body.method || 'CREDIT_CARD',
    });

    // Create Stripe payment intent for card payments
    if (body.method === 'CREDIT_CARD' || body.method === 'DEBIT_CARD') {
      try {
        const intent = await this.stripeGateway.createPaymentIntent(
          body.amount,
          body.currency || 'USD',
        );

        return {
          paymentId: payment.id,
          clientSecret: intent.clientSecret,
          paymentIntentId: intent.paymentIntentId,
        };
      } catch (error) {
        this.logger.warn(`Stripe not available: ${error.message}`);
        return { paymentId: payment.id };
      }
    }

    return { paymentId: payment.id };
  }

  @Get('user/:userId')
  async getPaymentsByUser(@Param('userId') userId: string) {
    return this.paymentRepository.findPaymentsByUser(userId);
  }

  @Get(':id')
  async getPayment(@Param('id') id: string) {
    return this.paymentRepository.findPaymentById(id);
  }
}