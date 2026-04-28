import { DriverPayout } from '../types/financial.types';
import {
  getCompletedRides,
  getPendingPayouts,
  createDriverPayout,
} from '../firestore/financial.service';
import { mongoGetDriverName } from '../mongodb/users.repository';

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
    const driverName = await mongoGetDriverName(driverId);
    const payout = await createDriverPayout(
      driverId,
      driverName,
      driverRides,
      'daily',
      from,
      to,
    );

    payouts.push(payout);
    console.log(`[payouts] ${driverName}: ${driverRides.length} rides → $${payout.driverEarningsNet}`);
  }

  return payouts;
}

// Generar liquidaciones semanales (Lunes 9am Ecuador)
//
// Calcula la semana ANTERIOR (lunes 00:00 a domingo 23:59 previos),
// no la actual — para que cuando corra el lunes 9am ya cubra los 7
// días completos del periodo de pago.
export async function generateWeeklyPayouts(): Promise<DriverPayout[]> {
  const now = new Date();
  // Lunes ISO: día - dayOfWeek (0=dom, 1=lun) — ajustado a lunes-base
  const day  = now.getDay();
  const diff = day === 0 ? 7 : day; // si hoy es lunes diff=1, lunes pasado = -7

  // Lunes pasado 00:00
  const from = new Date(now);
  from.setDate(now.getDate() - diff - 6); // retrocede al LUNES de la semana anterior
  from.setHours(0, 0, 0, 0);

  // Domingo pasado 23:59
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  to.setHours(23, 59, 59, 999);

  console.log(`[payouts-weekly] periodo ${from.toISOString().slice(0, 10)} → ${to.toISOString().slice(0, 10)}`);

  const allRides = await getCompletedRides(from, to);
  if (allRides.length === 0) {
    console.log('[payouts-weekly] sin viajes en la semana — nada que liquidar');
    return [];
  }

  const ridesByDriver = new Map<string, typeof allRides>();
  for (const ride of allRides) {
    const existing = ridesByDriver.get(ride.driverId) || [];
    existing.push(ride);
    ridesByDriver.set(ride.driverId, existing);
  }

  const payouts: DriverPayout[] = [];
  for (const [driverId, driverRides] of ridesByDriver) {
    if (!driverId) continue; // ignorar rides sin conductor
    const driverName = await mongoGetDriverName(driverId);
    const payout = await createDriverPayout(driverId, driverName, driverRides, 'weekly', from, to);
    payouts.push(payout);
    console.log(`[payouts-weekly] ${driverName}: ${driverRides.length} viajes → $${payout.driverEarningsNet}`);
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
