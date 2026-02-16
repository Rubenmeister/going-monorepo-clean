import { BadRequestException } from '@nestjs/common';
import { PaymentController } from './payment.controller';

const mockCreateIntentUseCase = { execute: jest.fn() };

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new PaymentController(mockCreateIntentUseCase as any);
  });

  it('should create payment intent', async () => {
    mockCreateIntentUseCase.execute.mockResolvedValue({ clientSecret: 'cs_test' });
    const result = await controller.createPaymentIntent({} as any);
    expect(result).toEqual({ clientSecret: 'cs_test' });
  });

  it('should throw BadRequestException on error', async () => {
    mockCreateIntentUseCase.execute.mockRejectedValue(new Error('Stripe error'));
    await expect(controller.createPaymentIntent({} as any)).rejects.toThrow(BadRequestException);
  });
});
