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

// Generar liquidaciones diarias para todos los conductores
export async function generateDailyPayouts(date?: Date): Promise<DriverPayout[]> {
  const d    = date || new Date();
  const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  // Una sola consulta para todos los viajes del día
  const allRides = await getCompletedRides(from, to);
  if (allRides.length === 0) {
    console.log('[payouts] No completed rides today');
    return [];
  }

  // Agrupar por conductor
  const ridesByDriver = new Map<string, typeof allRides>();
  for (const ride of allRides) {
    const existing = ridesByDriver.get(ride.driverId) || [];
    existing.push(ride);
    ridesByDriver.set(ride.driverId, existing);
  }

  const payouts: DriverPayout[] = [];

  for (const [driverId, driverRides] of ridesByDriver) {
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

  // Una sola consulta para todos los viajes de la semana
  const allRides = await getCompletedRides(from, to);
  if (allRides.length === 0) return [];

  // Agrupar por conductor
  const ridesByDriver = new Map<string, typeof allRides>();
  for (const ride of allRides) {
    const existing = ridesByDriver.get(ride.driverId) || [];
    existing.push(ride);
    ridesByDriver.set(ride.driverId, existing);
  }

  const payouts: DriverPayout[] = [];

  for (const [driverId, driverRides] of ridesByDriver) {
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
