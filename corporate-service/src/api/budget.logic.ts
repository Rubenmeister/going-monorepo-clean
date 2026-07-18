/**
 * Lógica PURA de límites de presupuesto corporativo (sin Mongo/HTTP, testeable).
 * Spec: cada empleado tiene límites de gasto diario/semanal/mensual.
 */

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

export interface LimitAmounts {
  daily?: number | null;
  weekly?: number | null;
  monthly?: number | null;
}

export interface PeriodSpend {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface BudgetCheck {
  allowed: boolean;
  breachedPeriod?: BudgetPeriod;
  limit?: number;
  wouldSpend?: number;
  /** Saldo restante por período (null = sin límite definido). */
  remaining: { daily: number | null; weekly: number | null; monthly: number | null };
}

/** Inicio del período (día/semana lunes/mes) para una fecha dada. */
export function periodStart(period: BudgetPeriod, now: Date = new Date()): Date {
  const d = new Date(now);
  if (period === 'daily') {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'weekly') {
    const dow = d.getDay(); // 0=Dom … 6=Sáb
    const backToMonday = dow === 0 ? 6 : dow - 1;
    d.setDate(d.getDate() - backToMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

interface BookingLike {
  userId?: string;
  status?: string;
  /**
   * En runtime llega como Money ({ amount, currency }); el tipo decía `number`
   * y por eso TypeScript no avisó de que se estaban SUMANDO objetos. Se declara
   * la forma real para que el compilador obligue a extraer el monto.
   */
  totalPrice?: number | { amount?: number; currency?: string };
  amount?: number;
  createdAt?: string | Date;
}

/** Estados que cuentan como gasto comprometido del empleado. */
const SPEND_STATUSES = new Set(['completed', 'confirmed', 'in_progress', 'pending']);

/**
 * Gasto del empleado en cada período (a partir de las reservas de la empresa).
 * Un mismo booking suma a los períodos que lo contienen (mes ⊇ semana ⊇ día).
 */
export function computePeriodSpend(
  bookings: BookingLike[],
  employeeId: string,
  now: Date = new Date(),
): PeriodSpend {
  const dayStart = periodStart('daily', now).getTime();
  const weekStart = periodStart('weekly', now).getTime();
  const monthStart = periodStart('monthly', now).getTime();

  let daily = 0;
  let weekly = 0;
  let monthly = 0;

  for (const b of bookings) {
    if (b.userId !== employeeId) continue;
    if (!b.status || !SPEND_STATUSES.has(b.status)) continue;
    // totalPrice es Money ({ amount, currency }): sumarlo pelado acumulaba
    // objetos y el control de presupuesto comparaba basura.
    const tp = b.totalPrice;
    const bruto =
      typeof tp === 'object' && tp !== null ? tp.amount ?? 0 : tp ?? b.amount ?? 0;
    const amount = Number.isFinite(Number(bruto)) ? Number(bruto) : 0;
    const t = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (t >= monthStart) monthly += amount;
    if (t >= weekStart) weekly += amount;
    if (t >= dayStart) daily += amount;
  }
  return { daily, weekly, monthly };
}

/**
 * ¿Puede gastar `newAmount` sin exceder ningún límite? Devuelve el primer
 * período que se excedería (día → semana → mes) y el saldo restante por período.
 */
export function checkBudget(
  limit: LimitAmounts,
  spend: PeriodSpend,
  newAmount: number,
): BudgetCheck {
  const remaining = {
    daily: limit.daily != null ? Math.max(0, limit.daily - spend.daily) : null,
    weekly: limit.weekly != null ? Math.max(0, limit.weekly - spend.weekly) : null,
    monthly: limit.monthly != null ? Math.max(0, limit.monthly - spend.monthly) : null,
  };

  for (const p of ['daily', 'weekly', 'monthly'] as BudgetPeriod[]) {
    const lim = limit[p];
    if (lim != null && spend[p] + newAmount > lim) {
      return {
        allowed: false,
        breachedPeriod: p,
        limit: lim,
        wouldSpend: Math.round((spend[p] + newAmount) * 100) / 100,
        remaining,
      };
    }
  }
  return { allowed: true, remaining };
}
