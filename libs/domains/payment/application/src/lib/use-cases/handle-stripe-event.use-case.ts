import { Inject, Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  ITransactionRepository,
  IPaymentGateway,
} from '@going-monorepo-clean/domains-payment-core';

@Injectable()
export class HandleStripeEventUseCase {
  private readonly logger = new Logger(HandleStripeEventUseCase.name);

  constructor(
    @Inject(IPaymentGateway)
    private readonly paymentGateway: IPaymentGateway,
    @Inject(ITransactionRepository)
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async execute(payload: Buffer, signature: string): Promise<void> {
    const eventResult = await this.paymentGateway.constructWebhookEvent(
      payload,
      signature,
    );

    if (eventResult.isErr()) {
      this.logger.error(`Webhook validation failed: ${eventResult.error.message}`);
      throw eventResult.error; // Lanza el error para que Nest lo maneje (ej. 400 Bad Request)
    }

    const event = eventResult.value;
    const paymentIntent = event.data.object;

    switch (event.type) {
      case 'payment_intent.succeeded':
        this.logger.log(`Payment Succeeded: ${paymentIntent.id}`);
        await this.handlePaymentSuccess(paymentIntent.id);
        break;
      case 'payment_intent.payment_failed':
        this.logger.warn(`Payment Failed: ${paymentIntent.id}`);
        await this.handlePaymentFailure(paymentIntent.id);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntentId: string) {
    const txResult = await this.transactionRepo.findByPaymentIntentId(paymentIntentId);
    if (txResult.isErr()) {
      throw new InternalServerErrorException(txResult.error.message);
    }
    const transaction = txResult.value;

    if (!transaction) {
      throw new NotFoundException(`Transaction not found for paymentIntentId: ${paymentIntentId}`);
    }

    transaction.succeed();
    await this.transactionRepo.update(transaction);
    this.logger.log(`Transaction ${transaction.id} marked as 'succeeded'`);
    // Aquí podrías disparar un evento: new PaymentSucceededEvent(transaction.id, transaction.referenceId)
  }

  private async handlePaymentFailure(paymentIntentId: string) {
    const txResult = await this.transactionRepo.findByPaymentIntentId(paymentIntentId);
    if (txResult.isErr()) {
      throw new InternalServerErrorException(txResult.error.message);
    }
    const transaction = txResult.value;

    if (!transaction) {
      throw new NotFoundException(`Transaction not found for paymentIntentId: ${paymentIntentId}`);
    }
    
    transaction.fail();
    await this.transactionRepo.update(transaction);
    this.logger.log(`Transaction ${transaction.id} marked as 'failed'`);
  }
}