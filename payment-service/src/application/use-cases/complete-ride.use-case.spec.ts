import { CompleteRideUseCase } from './complete-ride.use-case';

describe('CompleteRideUseCase', () => {
  let paymentRepo: { findByTrip: jest.Mock };
  let payoutRepo: {
    findByDriverAndPeriod: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let processPayment: { execute: jest.Mock };
  let loyalty: { awardPointsForRide: jest.Mock };
  let uc: CompleteRideUseCase;

  // Por defecto efectivo (modelo "comisión por cobrar": no genera payout).
  const input = {
    tripId: 't1',
    passengerId: 'p1',
    driverId: 'd1',
    finalFare: 100,
    actualDistance: 10,
    actualDuration: 20,
    paymentMethod: 'cash' as const,
  };

  // Variante wallet/digital (la plataforma retiene fondos → sí genera payout).
  const walletInput = { ...input, paymentMethod: 'wallet' as const };

  const completedPayment = {
    id: 'pay1',
    status: 'completed',
    amount: 100,
    driverAmount: 80,
    platformFee: 20,
  };

  beforeEach(() => {
    paymentRepo = {
      // Sin pago previo para el viaje → la ruta normal procede.
      findByTrip: jest.fn().mockResolvedValue(null),
    };
    payoutRepo = {
      findByDriverAndPeriod: jest.fn().mockResolvedValue(null),
      create: jest.fn(async (p) => ({ ...p })),
      update: jest.fn(async (id, patch) => ({ id, ...patch })),
    };
    processPayment = { execute: jest.fn() };
    loyalty = { awardPointsForRide: jest.fn().mockResolvedValue(undefined) };
    uc = new CompleteRideUseCase(
      paymentRepo as never,
      payoutRepo as never,
      processPayment as never,
      loyalty as never
    );
  });

  it('completa el viaje y devuelve ingresos de conductor y plataforma', async () => {
    processPayment.execute.mockResolvedValue(completedPayment);
    const r = await uc.execute(input);
    expect(r.completion.tripId).toBe('t1');
    expect(r.completion.driverEarnings).toBe(80);
    expect(r.completion.platformRevenue).toBe(20);
  });

  it('otorga puntos de fidelidad al pasajero', async () => {
    processPayment.execute.mockResolvedValue(completedPayment);
    await uc.execute(input);
    expect(loyalty.awardPointsForRide).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'p1', amountUsd: 100, tripId: 't1' })
    );
  });

  it('crea un payout semanal nuevo para el conductor (método no-efectivo)', async () => {
    processPayment.execute.mockResolvedValue(completedPayment);
    await uc.execute(walletInput);
    expect(payoutRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        driverId: 'd1',
        amount: 80,
        transactionIds: ['pay1'],
      })
    );
  });

  it('acumula sobre un payout existente de la misma semana (método no-efectivo)', async () => {
    payoutRepo.findByDriverAndPeriod.mockResolvedValue({
      id: 'po-existing',
      amount: 50,
      netAmount: 50,
      fees: 0,
      transactionCount: 1,
      transactionIds: ['old'],
    });
    processPayment.execute.mockResolvedValue(completedPayment);
    await uc.execute(walletInput);
    expect(payoutRepo.update).toHaveBeenCalledWith(
      'po-existing',
      expect.objectContaining({ amount: 130, transactionCount: 2 })
    );
    expect(payoutRepo.create).not.toHaveBeenCalled();
  });

  it('en EFECTIVO no genera payout retirable (el conductor ya cobró en mano)', async () => {
    processPayment.execute.mockResolvedValue(completedPayment);
    await uc.execute(input); // cash
    expect(payoutRepo.create).not.toHaveBeenCalled();
    expect(payoutRepo.update).not.toHaveBeenCalled();
  });

  it('es idempotente: si ya existe un Payment del viaje, no reprocesa ni duplica', async () => {
    paymentRepo.findByTrip.mockResolvedValue({
      id: 'pay-existing',
      status: 'completed',
      amount: 100,
      driverAmount: 80,
      platformFee: 20,
      completedAt: new Date(),
    });
    const r = await uc.execute(input);
    expect(processPayment.execute).not.toHaveBeenCalled();
    expect(payoutRepo.create).not.toHaveBeenCalled();
    expect(r.completion.driverEarnings).toBe(80);
    expect(r.completion.platformRevenue).toBe(20);
  });

  it('lanza si el pago no llega a completarse', async () => {
    processPayment.execute.mockResolvedValue({ id: 'pay1', status: 'pending' });
    await expect(uc.execute(input)).rejects.toThrow('Payment processing failed');
  });
});
