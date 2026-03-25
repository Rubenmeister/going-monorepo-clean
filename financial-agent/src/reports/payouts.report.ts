import { DriverPayout } from '../types/financial.types';
import {
  getCompletedRides,
  getPendingPayouts,
  createDriverPayout,
} from '../firestore/financial.service';

// ============================================================
// Driver Payouts – Liquidaciones a conductores
// Comisión Going: 20% | Conductor: 80%
// ============================================================

// Obtener todos los conductores activos del día
async function getActiveDriverIds(from: Date, to: Date): Promise<string[]> {
  const rides = await getCompletedRides(from, to);
  return [...new Set(rides.map(r => r.driverId))];
}

// Generar liquidaciones diarias para todos los conductores
export async function generateDailyPayouts(date?: Date): Promise<DriverPayout[]> {
  const d    = date || new Date();
  const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  const driverIds = await getActiveDriverIds(from, to);
  if (driverIds.length === 0) {
    console.log('[payouts] No active drivers today');
    return [];
  }

  const payouts: DriverPayout[] = [];

  for (const driverId of driverIds) {
    const rides = await getCompletedRides(from, to);
    const driverRides = rides.filter(r => r.driverId === driverId);

    if (driverRides.length === 0) continue;

    // Nombre del conductor (en producción vendría de Firestore drivers collection)
    const driverName = `Conductor ${driverId.slice(-4)}`;

    const payout = await createDriverPayout(
      driverId,
      driverName,
      driverRides,
      'daily',
      from,
      to,
    );

    payouts.push(payout);
    console.log(`[payouts] Driver ${driverId}: ${driverRides.length} rides → $${payout.driverEarningsNet}`);
  }

  return payouts;
}

// Generar liquidaciones semanales
export async function generateWeeklyPayouts(): Promise<DriverPayout[]> {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const from = new Date(now.getTime() - diff * 86400 * 1000);
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const driverIds = await getActiveDriverIds(from, to);
  const payouts: DriverPayout[] = [];

  for (const driverId of driverIds) {
    const rides = await getCompletedRides(from, to);
    const driverRides = rides.filter(r => r.driverId === driverId);
    if (driverRides.length === 0) continue;

    const driverName = `Conductor ${driverId.slice(-4)}`;
    const payout = await createDriverPayout(driverId, driverName, driverRides, 'weekly', from, to);
    payouts.push(payout);
  }

  return payouts;
}

// Resumen de liquidaciones pendientes
export async function getPendingPayoutsSummary(): Promise<{
  count: number;
  totalAmount: number;
  payouts: DriverPayout[];
}> {
  const pending = await getPendingPayouts();
  const totalAmount = pending.reduce((s, p) => s + p.driverEarningsNet, 0);

  return {
    count: pending.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    payouts: pending,
  };
}
