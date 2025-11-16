import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Result } from 'neverthrow';
import {
  Transaction,
  ITransactionRepository,
  IPaymentGateway,
} from '@going-monorepo-clean/domains-payment-core';
import { Money } from '@going-monorepo-clean/shared-domain';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';

@Injectable()
export class CreatePaymentIntentUseCase {
  constructor(
    @Inject(IPaymentGateway)
    private readonly paymentGateway: IPaymentGateway,
    @Inject(ITransactionRepository)
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async execute(dto: CreatePaymentIntentDto): Promise<{ clientSecret: string }> {
    const amountVO = new Money(dto.price.amount, dto.price.currency);

    const transactionResult = Transaction.create({
      amount: amountVO,
      userId: dto.userId,
      referenceId: dto.referenceId,
    });

    if (transactionResult.isErr()) {
      throw new InternalServerErrorException(transactionResult.error.message);
    }
    const transaction = transactionResult.value;

    const intentResult = await this.paymentGateway.createPaymentIntent(amountVO);
    if (intentResult.isErr()) {
      throw new InternalServerErrorException(intentResult.error.message);
    }
    const intent = intentResult.value;

    transaction.setPaymentIntent(intent.paymentIntentId);

    const saveResult = await this.transactionRepo.save(transaction);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }

    return { clientSecret: intent.clientSecret };
  }
}