import { Inject, Injectable, Logger, InternalServerErrorException, NotFoundException, Optional } from '@nestjs/common';
import {
  ITransactionRepository,
  IPaymentGateway,
  PaymentSucceededEvent,
  PaymentFailedEvent,
} from '@going-monorepo-clean/domains-payment-core';
import { IEventBus } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class HandleStripeEventUseCase {
  private readonly logger = new Logger(HandleStripeEventUseCase.name);

  constructor(
    @Inject(IPaymentGateway)
    private readonly paymentGateway: IPaymentGateway,
    @Inject(ITransactionRepository)
    private readonly transactionRepo: ITransactionRepository,
    @Optional() @Inject(IEventBus)
    private readonly eventBus?: IEventBus,
  ) {}

  async execute(payload: Buffer, signature: string): Promise<void> {
    const eventResult = await this.paymentGateway.constructWebhookEvent(
      payload,
      signature,
    );

    if (eventResult.isErr()) {
      this.logger.error(`Webhook validation failed: ${eventResult.error.message}`);
      throw eventResult.error;
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

    // Emit PaymentSucceededEvent for saga coordination
    if (this.eventBus) {
      await this.eventBus.publish(
        new PaymentSucceededEvent({
          transactionId: transaction.id,
          referenceId: transaction.toPrimitives().referenceId,
          paymentIntentId,
        }),
      );
    }
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

    // Emit PaymentFailedEvent for saga compensation
    if (this.eventBus) {
      await this.eventBus.publish(
        new PaymentFailedEvent({
          transactionId: transaction.id,
          referenceId: transaction.toPrimitives().referenceId,
          paymentIntentId,
        }),
      );
    }
  }
}
