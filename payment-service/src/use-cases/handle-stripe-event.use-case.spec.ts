import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { HandleStripeEventUseCase } from '@going-monorepo-clean/domains-payment-application';
import { ITransactionRepository, IPaymentGateway, Transaction } from '@going-monorepo-clean/domains-payment-core';
import { Money } from '@going-monorepo-clean/shared-domain';

const mockGateway = { createPaymentIntent: jest.fn(), constructWebhookEvent: jest.fn() };
const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByPaymentIntentId: jest.fn() };

describe('HandleStripeEventUseCase', () => {
  let useCase: HandleStripeEventUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleStripeEventUseCase,
        { provide: IPaymentGateway, useValue: mockGateway },
        { provide: ITransactionRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(HandleStripeEventUseCase);
  });

  const createTx = () => {
    const tx = Transaction.create({
      userId: 'user-1',
      referenceId: 'ref-1',
      amount: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
    })._unsafeUnwrap();
    tx.setPaymentIntent('pi_123');
    return tx;
  };

  it('should handle payment_intent.succeeded', async () => {
    const tx = createTx();
    mockGateway.constructWebhookEvent.mockResolvedValue(ok({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    }));
    mockRepo.findByPaymentIntentId.mockResolvedValue(ok(tx));
    mockRepo.update.mockResolvedValue(ok(undefined));

    await useCase.execute(Buffer.from('body'), 'sig');
    expect(tx.status).toBe('succeeded');
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('should handle payment_intent.payment_failed', async () => {
    const tx = createTx();
    mockGateway.constructWebhookEvent.mockResolvedValue(ok({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_123' } },
    }));
    mockRepo.findByPaymentIntentId.mockResolvedValue(ok(tx));
    mockRepo.update.mockResolvedValue(ok(undefined));

    await useCase.execute(Buffer.from('body'), 'sig');
    expect(tx.status).toBe('failed');
  });

  it('should throw when webhook validation fails', async () => {
    mockGateway.constructWebhookEvent.mockResolvedValue(err(new Error('Bad signature')));
    await expect(useCase.execute(Buffer.from('body'), 'bad-sig')).rejects.toThrow();
  });

  it('should throw when transaction not found', async () => {
    mockGateway.constructWebhookEvent.mockResolvedValue(ok({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_missing' } },
    }));
    mockRepo.findByPaymentIntentId.mockResolvedValue(ok(null));
    await expect(useCase.execute(Buffer.from('body'), 'sig')).rejects.toThrow(NotFoundException);
  });

  it('should handle unrecognized event type gracefully', async () => {
    mockGateway.constructWebhookEvent.mockResolvedValue(ok({
      type: 'customer.created',
      data: { object: { id: 'cus_123' } },
    }));
    await expect(useCase.execute(Buffer.from('body'), 'sig')).resolves.toBeUndefined();
  });
});
