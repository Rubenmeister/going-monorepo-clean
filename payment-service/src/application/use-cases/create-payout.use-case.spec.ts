import { CreatePayoutUseCase } from './create-payout.use-case';

describe('CreatePayoutUseCase', () => {
  let repo: {
    findByStatus: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let stripe: { createPayout: jest.Mock };
  let uc: CreatePayoutUseCase;

  const payout = (over: Record<string, unknown> = {}) => ({
    id: 'po1',
    driverId: 'd1',
    netAmount: 100,
    transactionCount: 1,
    transactionIds: ['a'],
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-01-07'),
    ...over,
  });

  beforeEach(() => {
    repo = {
      findByStatus: jest.fn(),
      create: jest.fn(async (p) => ({ ...p })),
      update: jest.fn(async (id, patch) => ({ id, ...patch })),
    };
    stripe = { createPayout: jest.fn() };
    uc = new CreatePayoutUseCase(repo as never, stripe as never);
  });

  it('lanza si el conductor no tiene payouts pendientes', async () => {
    repo.findByStatus.mockResolvedValue([]);
    await expect(
      uc.execute({ driverId: 'd1', bankAccountId: 'ba', paymentMethod: 'wallet' })
    ).rejects.toThrow('No pending payouts');
  });

  it('agrega varios payouts y aplica el fee del 2%', async () => {
    repo.findByStatus.mockResolvedValue([
      payout({ netAmount: 100, transactionIds: ['a'] }),
      payout({ id: 'po2', netAmount: 100, transactionIds: ['b'] }),
    ]);
    await uc.execute({
      driverId: 'd1',
      bankAccountId: 'ba',
      paymentMethod: 'wallet',
    });
    // total 200 → fee 2% = 4 → net 196
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 200, fees: 4, netAmount: 196 })
    );
  });

  it('wallet se completa de inmediato (sin Stripe)', async () => {
    repo.findByStatus.mockResolvedValue([payout()]);
    const r = await uc.execute({
      driverId: 'd1',
      bankAccountId: 'ba',
      paymentMethod: 'wallet',
    });
    expect(r.status).toBe('completed');
    expect(stripe.createPayout).not.toHaveBeenCalled();
  });

  it('bank_account con éxito → processing y marca los antiguos como completed', async () => {
    repo.findByStatus.mockResolvedValue([payout()]);
    stripe.createPayout.mockResolvedValue({ success: true, payoutId: 'sp_1' });
    const r = await uc.execute({
      driverId: 'd1',
      bankAccountId: 'ba',
      paymentMethod: 'bank_account',
    });
    expect(stripe.createPayout).toHaveBeenCalled();
    expect(r.status).toBe('processing');
    expect(repo.update).toHaveBeenCalledWith(
      'po1',
      expect.objectContaining({ status: 'completed' })
    );
  });

  it('bank_account con fallo → marca failed y lanza', async () => {
    repo.findByStatus.mockResolvedValue([payout()]);
    stripe.createPayout.mockResolvedValue({ success: false, error: 'bank_error' });
    await expect(
      uc.execute({
        driverId: 'd1',
        bankAccountId: 'ba',
        paymentMethod: 'bank_account',
      })
    ).rejects.toThrow('bank_error');
    expect(repo.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'failed' })
    );
  });
});
