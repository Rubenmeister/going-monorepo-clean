import { RevenueReport, DAILY_REVENUE_TARGET, GOING_COMMISSION_RATE } from '../types/financial.types';
import { getCompletedRides, getFailedPayments } from '../firestore/financial.service';

// ============================================================
// Revenue Reports – Daily / Weekly / Monthly
// ============================================================

function startOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
}
function endOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
}

export async function generateDailyReport(date?: Date): Promise<RevenueReport> {
  const d = date || new Date();
  const from = startOfDay(d);
  const to   = endOfDay(d);

  const [rides, failedRides] = await Promise.all([
    getCompletedRides(from, to),
    getFailedPayments(from, to),
  ]);

  return buildReport('daily', from, to, rides, failedRides);
}

export async function generateWeeklyReport(fromDate?: Date, toDate?: Date): Promise<RevenueReport> {
  let from: Date;
  let to: Date;

  if (fromDate && toDate) {
    from = startOfDay(fromDate);
    to   = endOfDay(toDate);
  } else {
    const now  = new Date();
    const day  = now.getDay(); // 0=sun
    const diff = day === 0 ? 6 : day - 1; // Monday-based
    from = startOfDay(new Date(now.getTime() - diff * 86400 * 1000));
    to   = endOfDay(now);
  }

  const [rides, failedRides] = await Promise.all([
    getCompletedRides(from, to),
    getFailedPayments(from, to),
  ]);

  return buildReport('weekly', from, to, rides, failedRides);
}

export async function generateMonthlyReport(year?: number, month?: number): Promise<RevenueReport> {
  const now = new Date();
  const y   = year  || now.getFullYear();
  const m   = month || now.getMonth();
  const from = new Date(y, m, 1, 0, 0, 0);
  const to   = new Date(y, m + 1, 0, 23, 59, 59);

  const [rides, failedRides] = await Promise.all([
    getCompletedRides(from, to),
    getFailedPayments(from, to),
  ]);

  return buildReport('monthly', from, to, rides, failedRides);
}

// ─── Builder ──────────────────────────────────────────────────
function buildReport(
  period: RevenueReport['period'],
  from: Date,
  to: Date,
  rides: Awaited<ReturnType<typeof getCompletedRides>>,
  failedRides: Awaited<ReturnType<typeof getFailedPayments>>,
): RevenueReport {
  const r = (n: number) => Math.round(n * 100) / 100;

  const totalRevenue    = r(rides.reduce((s, x) => s + x.fareTotal, 0));
  const goingRevenue    = r(rides.reduce((s, x) => s + x.goingCommission, 0));
  const driverRevenue   = r(rides.reduce((s, x) => s + x.driverEarnings, 0));
  const ivaCollected    = r(rides.reduce((s, x) => s + x.ivaAmount, 0));
  const refundedAmount  = 0; // Would come from refunded rides

  const cardPayments    = r(rides.filter(x => x.paymentMethod === 'card').reduce((s, x) => s + x.fareTotal, 0));
  const cashPayments    = r(rides.filter(x => x.paymentMethod === 'cash').reduce((s, x) => s + x.fareTotal, 0));
  const transferPayments = r(rides.filter(x => x.paymentMethod === 'transfer').reduce((s, x) => s + x.fareTotal, 0));
  const failedPayments  = r(failedRides.reduce((s, x) => s + x.fareTotal, 0));

  // Per driver breakdown
  const driverMap = new Map<string, { name: string; rides: number; revenue: number; earnings: number }>();
  rides.forEach(ride => {
    const existing = driverMap.get(ride.driverId) || { name: ride.driverId, rides: 0, revenue: 0, earnings: 0 };
    driverMap.set(ride.driverId, {
      name: existing.name,
      rides: existing.rides + 1,
      revenue: existing.revenue + ride.fareTotal,
      earnings: existing.earnings + ride.driverEarnings,
    });
  });

  const driverBreakdown = Array.from(driverMap.entries()).map(([driverId, data]) => ({
    driverId,
    driverName: data.name,
    rides: data.rides,
    revenue: r(data.revenue),
    earnings: r(data.earnings),
    metDailyTarget: data.revenue >= DAILY_REVENUE_TARGET,
  }));

  const driversMetTarget   = driverBreakdown.filter(d => d.metDailyTarget).length;
  const driversBelowTarget = driverBreakdown.filter(d => !d.metDailyTarget).length;
  const avgRevenue         = driverBreakdown.length > 0
    ? r(driverBreakdown.reduce((s, d) => s + d.revenue, 0) / driverBreakdown.length)
    : 0;

  return {
    period,
    from,
    to,
    totalRevenue,
    goingRevenue,
    driverRevenue,
    ivaCollected,
    totalRides: rides.length,
    cancelledRides: 0,
    refundedAmount,
    cardPayments,
    cashPayments,
    transferPayments,
    failedPayments,
    failedPaymentsCount: failedRides.length,
    driverBreakdown,
    dailyTargetPerDriver: DAILY_REVENUE_TARGET,
    driversMetTarget,
    driversBelowTarget,
    avgRevenuePerDriver: avgRevenue,
    generatedAt: new Date(),
  };
}
