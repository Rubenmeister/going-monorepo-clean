import { checkBudget, computePeriodSpend, periodStart } from './budget.logic';

describe('budget.logic — periodStart', () => {
  const friday = new Date(2026, 4, 22, 12, 0); // vie 22-may-2026

  it('daily → medianoche de hoy', () => {
    const d = periodStart('daily', friday);
    expect(d.getHours()).toBe(0);
    expect(d.getDate()).toBe(22);
  });
  it('weekly → lunes de la semana', () => {
    const d = periodStart('weekly', friday);
    expect(d.getDay()).toBe(1); // lunes
    expect(d.getDate()).toBe(18);
  });
  it('monthly → día 1 del mes', () => {
    const d = periodStart('monthly', friday);
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(4); // mayo
  });
});

describe('budget.logic — computePeriodSpend', () => {
  const now = new Date(2026, 4, 22, 12, 0); // vie 22-may
  const bookings = [
    { userId: 'e1', status: 'completed', amount: 10, createdAt: '2026-05-22T09:00:00' }, // hoy
    { userId: 'e1', status: 'confirmed', amount: 20, createdAt: '2026-05-19T10:00:00' }, // esta semana (mar)
    { userId: 'e1', status: 'completed', amount: 30, createdAt: '2026-05-05T10:00:00' }, // este mes
    { userId: 'e1', status: 'cancelled', amount: 99, createdAt: '2026-05-22T08:00:00' }, // cancelado → no cuenta
    { userId: 'e2', status: 'completed', amount: 50, createdAt: '2026-05-22T09:00:00' }, // otro empleado
  ];

  it('suma por período, filtrando empleado + estados', () => {
    const s = computePeriodSpend(bookings, 'e1', now);
    expect(s.daily).toBe(10);
    expect(s.weekly).toBe(30); // 10 (hoy) + 20 (esta semana)
    expect(s.monthly).toBe(60); // 10 + 20 + 30
  });
});

describe('budget.logic — checkBudget', () => {
  const spend = { daily: 10, weekly: 30, monthly: 60 };

  it('sin límites → permitido', () => {
    const r = checkBudget({}, spend, 100);
    expect(r.allowed).toBe(true);
    expect(r.remaining.monthly).toBeNull();
  });

  it('mensual: dentro del límite → permitido', () => {
    const r = checkBudget({ monthly: 100 }, spend, 40); // 60+40=100, no excede
    expect(r.allowed).toBe(true);
    expect(r.remaining.monthly).toBe(40);
  });

  it('mensual: excede → bloquea con período mensual', () => {
    const r = checkBudget({ monthly: 100 }, spend, 50); // 60+50=110 > 100
    expect(r.allowed).toBe(false);
    expect(r.breachedPeriod).toBe('monthly');
    expect(r.wouldSpend).toBe(110);
  });

  it('diario se evalúa primero', () => {
    const r = checkBudget({ daily: 15, monthly: 1000 }, spend, 10); // diario 10+10=20 > 15
    expect(r.allowed).toBe(false);
    expect(r.breachedPeriod).toBe('daily');
  });
});
