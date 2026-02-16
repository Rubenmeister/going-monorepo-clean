import { BadRequestException } from '@nestjs/common';
import { WebhookController } from './webhook.controller';

const mockHandleStripeUseCase = { execute: jest.fn() };

describe('WebhookController', () => {
  let controller: WebhookController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new WebhookController(mockHandleStripeUseCase as any);
  });

  it('should process webhook successfully', async () => {
    mockHandleStripeUseCase.execute.mockResolvedValue(undefined);
    const req = { rawBody: Buffer.from('test') } as any;
    const result = await controller.handleStripeWebhook('sig_123', req);
    expect(result).toEqual({ received: true });
    expect(mockHandleStripeUseCase.execute).toHaveBeenCalledWith(Buffer.from('test'), 'sig_123');
  });

  it('should throw when missing signature', async () => {
    const req = { rawBody: Buffer.from('test') } as any;
    await expect(controller.handleStripeWebhook(undefined, req)).rejects.toThrow(BadRequestException);
  });

  it('should throw when missing raw body', async () => {
    const req = {} as any;
    await expect(controller.handleStripeWebhook('sig_123', req)).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException on processing error', async () => {
    mockHandleStripeUseCase.execute.mockRejectedValue(new Error('Bad event'));
    const req = { rawBody: Buffer.from('test') } as any;
    await expect(controller.handleStripeWebhook('sig_123', req)).rejects.toThrow(BadRequestException);
  });
});
