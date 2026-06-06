import { CompleteRideUseCase } from './complete-ride.use-case';

describe('CompleteRideUseCase', () => {
  let paymentRepo: Record<string, unknown>;
  let payoutRepo: {
    findByDriverAndPeriod: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let processPayment: { execute: jest.Mock };
  let loyalty: { awardPointsForRide: jest.Mock };
  let uc: CompleteRideUseCase;

  const input = {
    tripId: 't1',
    passengerId: 'p1',
    driverId: 'd1',
    finalFare: 100,
    actualDistance: 10,
    actualDuration: 20,
    paymentMethod: 'cash' as const,
  };

  const completedPayment = {
    id: 'pay1',
    status: 'completed',
    driverAmount: 80,
    platformFee: 20,
  };

  beforeEach(() => {
    paymentRepo = {};
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

  it('crea un payout semanal nuevo para el conductor', async () => {
    processPayment.execute.mockResolvedValue(completedPayment);
    await uc.execute(input);
    expect(payoutRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        driverId: 'd1',
        amount: 80,
        transactionIds: ['pay1'],
      })
    );
  });

  it('acumula sobre un payout existente de la misma semana', async () => {
    payoutRepo.findByDriverAndPeriod.mockResolvedValue({
      id: 'po-existing',
      amount: 50,
      netAmount: 50,
      fees: 0,
      transactionCount: 1,
      transactionIds: ['old'],
    });
    processPayment.execute.mockResolvedValue(completedPayment);
    await uc.execute(input);
    expect(payoutRepo.update).toHaveBeenCalledWith(
      'po-existing',
      expect.objectContaining({ amount: 130, transactionCount: 2 })
    );
    expect(payoutRepo.create).not.toHaveBeenCalled();
  });

  it('lanza si el pago no llega a completarse', async () => {
    processPayment.execute.mockResolvedValue({ id: 'pay1', status: 'pending' });
    await expect(uc.execute(input)).rejects.toThrow('Payment processing failed');
  });
});
