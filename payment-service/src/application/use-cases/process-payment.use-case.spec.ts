import { ProcessPaymentUseCase } from './process-payment.use-case';

describe('ProcessPaymentUseCase', () => {
  let repo: {
    create: jest.Mock;
    update: jest.Mock;
  };
  let stripe: { processPayment: jest.Mock };
  let pricing: { calculate: jest.Mock };
  let uc: ProcessPaymentUseCase;

  beforeEach(() => {
    repo = {
      create: jest.fn(async (p) => ({ ...p })),
      update: jest.fn(async (id, patch) => ({ id, ...patch })),
    };
    stripe = { processPayment: jest.fn() };
    pricing = { calculate: jest.fn() };
    uc = new ProcessPaymentUseCase(
      repo as never,
      stripe as never,
      pricing as never
    );
  });

  const base = {
    tripId: 't1',
    passengerId: 'p1',
    driverId: 'd1',
    amount: 100,
  };

  it('aplica el split 20/80 por defecto cuando no hay serviceType', async () => {
    await uc.execute({ ...base, paymentMethod: 'cash' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ platformFee: 20, driverAmount: 80 })
    );
  });

  it('pago en efectivo se completa al instante', async () => {
    const r = await uc.execute({ ...base, paymentMethod: 'cash' });
    expect(repo.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'completed' })
    );
    expect(r.status).toBe('completed');
  });

  it('pago con wallet se completa al instante', async () => {
    await uc.execute({ ...base, paymentMethod: 'wallet' });
    expect(repo.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'completed' })
    );
  });

  it('datafast queda pendiente (se confirma por webhook)', async () => {
    const r = await uc.execute({ ...base, paymentMethod: 'datafast' });
    expect(r.status).toBe('pending');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('tarjeta con éxito en Stripe → completed con transactionId', async () => {
    stripe.processPayment.mockResolvedValue({
      success: true,
      transactionId: 'tx_123',
    });
    const r = await uc.execute({
      ...base,
      paymentMethod: 'card',
      paymentMethodId: 'pm_1',
    });
    expect(stripe.processPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10000, currency: 'USD' })
    );
    expect(r.status).toBe('completed');
    expect(r.transactionId).toBe('tx_123');
  });

  it('tarjeta rechazada por Stripe → marca failed y lanza', async () => {
    stripe.processPayment.mockResolvedValue({
      success: false,
      error: 'card_declined',
    });
    await expect(
      uc.execute({ ...base, paymentMethod: 'card', paymentMethodId: 'pm_1' })
    ).rejects.toThrow('card_declined');
    expect(repo.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'failed' })
    );
  });

  it('tarjeta sin paymentMethodId → lanza Invalid payment method', async () => {
    await expect(
      uc.execute({ ...base, paymentMethod: 'card' })
    ).rejects.toThrow('Invalid payment method');
  });

  it('serviceType transport usa el desglose de PricingService', async () => {
    pricing.calculate.mockReturnValue({ platformFee: 5, providerAmount: 25 });
    await uc.execute({
      ...base,
      paymentMethod: 'cash',
      serviceType: 'transport',
      distanceKm: 10,
      durationMinutes: 20,
    });
    expect(pricing.calculate).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ platformFee: 5, driverAmount: 25 })
    );
  });
});
