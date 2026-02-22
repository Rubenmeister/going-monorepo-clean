import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Result } from 'neverthrow';
import {
  Transaction,
  ITransactionRepository,
  IPaymentGateway,
} from '@going-monorepo-clean/domains-payment-core';
import { Money } from '@going-monorepo-clean/shared-domain';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';

/**
 * Create Payment Intent Use Case
 * Implements idempotent payment intent creation to prevent duplicate charges
 *
 * SECURITY: Idempotency Support (PCI DSS requirement)
 * - Prevents duplicate payment intents from being created
 * - Solves the "double-charge" problem on network retries
 * - Client retries with same idempotencyKey get same response
 *
 * Implementation:
 * 1. If idempotencyKey provided, search for existing transaction with that key
 * 2. If found, return cached payment intent (idempotent operation)
 * 3. If not found, create new payment intent and store idempotencyKey
 * 4. On retry with same key, client gets same clientSecret
 *
 * Example:
 * Request 1: POST /payments/intent {userId, referenceId, price, idempotencyKey: "abc123"}
 *   → Creates payment intent pi_xxx, stores with idempotencyKey
 *   → Returns {clientSecret: "pi_xxx_secret"}
 *
 * Request 2 (retry): POST /payments/intent {userId, referenceId, price, idempotencyKey: "abc123"}
 *   → Finds existing transaction with idempotencyKey: "abc123"
 *   → Returns cached {clientSecret: "pi_xxx_secret"} (same intent, no duplicate)
 */
@Injectable()
export class CreatePaymentIntentUseCase {
  private readonly logger = new Logger(CreatePaymentIntentUseCase.name);

  constructor(
    @Inject(IPaymentGateway)
    private readonly paymentGateway: IPaymentGateway,
    @Inject(ITransactionRepository)
    private readonly transactionRepo: ITransactionRepository
  ) {}

  async execute(
    dto: CreatePaymentIntentDto
  ): Promise<{ clientSecret: string }> {
    const amountVO = new Money(dto.price.amount, dto.price.currency);

    // IDEMPOTENCY: Check if request with same idempotencyKey was already processed
    if (dto.idempotencyKey) {
      this.logger.debug(
        `Checking for existing payment intent with idempotencyKey: ${dto.idempotencyKey}`
      );

      try {
        // Search for transaction with this idempotencyKey
        const existingResult = await this.transactionRepo.findByIdempotencyKey(
          dto.idempotencyKey
        );

        if (existingResult && existingResult.isErr?.() === false) {
          const existingTransaction = existingResult.value;
          if (
            existingTransaction &&
            existingTransaction.paymentIntentId &&
            existingTransaction.clientSecret
          ) {
            this.logger.debug(
              `Found existing payment intent with idempotencyKey: ${dto.idempotencyKey}, returning cached result`
            );
            return {
              clientSecret: existingTransaction.clientSecret,
            };
          }
        }
      } catch (error) {
        // Log but don't fail - proceed to create new intent
        this.logger.warn(
          `Error checking for existing idempotency key: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // CREATE NEW PAYMENT INTENT
    const transactionResult = Transaction.create({
      amount: amountVO,
      userId: dto.userId,
      referenceId: dto.referenceId,
      idempotencyKey: dto.idempotencyKey, // Store idempotencyKey with transaction
    });

    if (transactionResult.isErr()) {
      throw new InternalServerErrorException(transactionResult.error.message);
    }
    const transaction = transactionResult.value;

    const intentResult = await this.paymentGateway.createPaymentIntent(
      amountVO,
      // Pass idempotencyKey to payment gateway for additional idempotency
      dto.idempotencyKey
    );

    if (intentResult.isErr()) {
      throw new InternalServerErrorException(intentResult.error.message);
    }
    const intent = intentResult.value;

    transaction.setPaymentIntent(intent.paymentIntentId);
    // Store clientSecret for idempotent retrieval
    (transaction as any).clientSecret = intent.clientSecret;

    const saveResult = await this.transactionRepo.save(transaction);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }

    this.logger.debug(
      `Created new payment intent ${
        intent.paymentIntentId
      } with idempotencyKey: ${dto.idempotencyKey || 'none'}`
    );

    return { clientSecret: intent.clientSecret };
  }
}
