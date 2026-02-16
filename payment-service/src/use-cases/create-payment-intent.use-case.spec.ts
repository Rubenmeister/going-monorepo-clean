import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { CreatePaymentIntentUseCase } from '@going-monorepo-clean/domains-payment-application';
import { ITransactionRepository, IPaymentGateway } from '@going-monorepo-clean/domains-payment-core';

const mockGateway = { createPaymentIntent: jest.fn(), constructWebhookEvent: jest.fn() };
const mockRepo = { save: jest.fn(), update: jest.fn(), findById: jest.fn(), findByPaymentIntentId: jest.fn() };

describe('CreatePaymentIntentUseCase', () => {
  let useCase: CreatePaymentIntentUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentIntentUseCase,
        { provide: IPaymentGateway, useValue: mockGateway },
        { provide: ITransactionRepository, useValue: mockRepo },
      ],
    }).compile();
    useCase = module.get(CreatePaymentIntentUseCase);
  });

  const dto = {
    userId: 'user-1',
    referenceId: 'trip-1',
    price: { amount: 5000, currency: 'USD' as const },
  };

  it('should create payment intent successfully', async () => {
    mockGateway.createPaymentIntent.mockResolvedValue(ok({ clientSecret: 'cs_test', paymentIntentId: 'pi_test' }));
    mockRepo.save.mockResolvedValue(ok(undefined));
    const result = await useCase.execute(dto);
    expect(result.clientSecret).toBe('cs_test');
  });

  it('should throw when gateway fails', async () => {
    mockGateway.createPaymentIntent.mockResolvedValue(err(new Error('Stripe error')));
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw when save fails', async () => {
    mockGateway.createPaymentIntent.mockResolvedValue(ok({ clientSecret: 'cs_test', paymentIntentId: 'pi_test' }));
    mockRepo.save.mockResolvedValue(err(new Error('DB error')));
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });
});
