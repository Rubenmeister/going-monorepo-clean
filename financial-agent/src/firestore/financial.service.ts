import { Firestore, Timestamp } from '@google-cloud/firestore';
import {
  Ride, DriverPayout, PaymentTransaction, FinancialAlert,
  GOING_COMMISSION_RATE, DRIVER_RATE, IVA_RATE,
} from '../types/financial.types';

const db = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

// ─── Rides ────────────────────────────────────────────────────

export async function getCompletedRides(from: Date, to: Date): Promise<Ride[]> {
  const snap = await db.collection('rides')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', Timestamp.fromDate(from))
    .where('completedAt', '<=', Timestamp.fromDate(to))
    .orderBy('completedAt', 'desc')
    .get();

  return snap.docs.map(d => docToRide(d.id, d.data()));
}

export async function getFailedPayments(from: Date, to: Date): Promise<Ride[]> {
  const snap = await db.collection('rides')
    .where('paymentStatus', '==', 'failed')
    .where('requestedAt', '>=', Timestamp.fromDate(from))
    .where('requestedAt', '<=', Timestamp.fromDate(to))
    .get();

  return snap.docs.map(d => docToRide(d.id, d.data()));
}

export async function getPendingPayments(): Promise<Ride[]> {
  const snap = await db.collection('rides')
    .where('paymentStatus', '==', 'authorized')  // authorized but not captured
    .where('status', '==', 'completed')
    .get();

  return snap.docs.map(d => docToRide(d.id, d.data()));
}

export async function getRidesByDriver(driverId: string, from: Date, to: Date): Promise<Ride[]> {
  const snap = await db.collection('rides')
    .where('driverId', '==', driverId)
    .where('status', '==', 'completed')
    .where('completedAt', '>=', Timestamp.fromDate(from))
    .where('completedAt', '<=', Timestamp.fromDate(to))
    .get();

  return snap.docs.map(d => docToRide(d.id, d.data()));
}

export async function updateRideInvoice(rideId: string, invoiceId: string): Promise<void> {
  await db.collection('rides').doc(rideId).update({ invoiceId, invoicedAt: Timestamp.now() });
}

// ─── Payouts ──────────────────────────────────────────────────

export async function getPendingPayouts(): Promise<DriverPayout[]> {
  const snap = await db.collection('driver_payouts')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DriverPayout));
}

export async function getPayoutsByDriver(driverId: string, limit = 10): Promise<DriverPayout[]> {
  const snap = await db.collection('driver_payouts')
    .where('driverId', '==', driverId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DriverPayout));
}

// Calcular y crear liquidación de un conductor
export async function createDriverPayout(
  driverId: string,
  driverName: string,
  rides: Ride[],
  period: 'daily' | 'weekly',
  periodStart: Date,
  periodEnd: Date,
): Promise<DriverPayout> {
  const totalFareCollected = rides.reduce((s, r) => s + r.fareTotal, 0);
  const goingCommission    = rides.reduce((s, r) => s + r.goingCommission, 0);
  const driverGross        = rides.reduce((s, r) => s + r.driverEarnings, 0);

  const payout: Omit<DriverPayout, 'id'> = {
    driverId,
    driverName,
    period,
    periodStart,
    periodEnd,
    totalRides: rides.length,
    totalFareCollected: round2(totalFareCollected),
    goingCommissionTotal: round2(goingCommission),
    driverEarningsGross: round2(driverGross),
    adjustments: 0,
    driverEarningsNet: round2(driverGross),
    status: 'pending',
    payoutMethod: 'transfer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ref = await db.collection('driver_payouts').add({
    ...payout,
    periodStart: Timestamp.fromDate(periodStart),
    periodEnd: Timestamp.fromDate(periodEnd),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return { id: ref.id, ...payout };
}

export async function updatePayoutStatus(
  payoutId: string,
  status: DriverPayout['status'],
  reference?: string,
): Promise<void> {
  await db.collection('driver_payouts').doc(payoutId).update({
    status,
    reference: reference || null,
    paidAt: status === 'completed' ? Timestamp.now() : null,
    updatedAt: Timestamp.now(),
  });
}

// ─── Transacciones de pago ────────────────────────────────────

export async function getChargebacks(from: Date, to: Date): Promise<PaymentTransaction[]> {
  const snap = await db.collection('payment_transactions')
    .where('status', '==', 'chargeback')
    .where('createdAt', '>=', Timestamp.fromDate(from))
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentTransaction));
}

export async function getPaymentErrorStats(from: Date, to: Date): Promise<{
  total: number;
  failed: number;
  failureRate: number;
  byErrorCode: Record<string, number>;
}> {
  const [allSnap, failedSnap] = await Promise.all([
    db.collection('payment_transactions')
      .where('createdAt', '>=', Timestamp.fromDate(from))
      .where('createdAt', '<=', Timestamp.fromDate(to))
      .get(),
    db.collection('payment_transactions')
      .where('status', '==', 'failed')
      .where('createdAt', '>=', Timestamp.fromDate(from))
      .where('createdAt', '<=', Timestamp.fromDate(to))
      .get(),
  ]);

  const byErrorCode: Record<string, number> = {};
  failedSnap.docs.forEach(d => {
    const code = d.data().errorCode || 'unknown';
    byErrorCode[code] = (byErrorCode[code] || 0) + 1;
  });

  const total  = allSnap.size;
  const failed = failedSnap.size;

  return {
    total,
    failed,
    failureRate: total > 0 ? (failed / total) * 100 : 0,
    byErrorCode,
  };
}

// ─── Alertas financieras ──────────────────────────────────────

export async function saveFinancialAlert(alert: FinancialAlert): Promise<void> {
  await db.collection('financial_alerts').add({
    ...alert,
    createdAt: Timestamp.now(),
  });
}

export async function getRecentAlerts(hours = 24): Promise<FinancialAlert[]> {
  const since = new Date(Date.now() - hours * 3600 * 1000);
  const snap = await db.collection('financial_alerts')
    .where('createdAt', '>=', Timestamp.fromDate(since))
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snap.docs.map(d => d.data() as FinancialAlert);
}

// ─── Helpers ──────────────────────────────────────────────────

function docToRide(id: string, data: FirebaseFirestore.DocumentData): Ride {
  return {
    id,
    driverId: data.driverId || '',
    passengerId: data.passengerId || '',
    status: data.status,
    rideType: data.rideType || 'private',
    origin: data.origin || '',
    destination: data.destination || '',
    distanceKm: data.distanceKm || 0,
    fareTotal: data.fareTotal || 0,
    fareSubtotal: data.fareSubtotal || round2((data.fareTotal || 0) / (1 + IVA_RATE)),
    ivaAmount: data.ivaAmount || round2((data.fareTotal || 0) - ((data.fareTotal || 0) / (1 + IVA_RATE))),
    goingCommission: data.goingCommission || round2(((data.fareTotal || 0) / (1 + IVA_RATE)) * GOING_COMMISSION_RATE),
    driverEarnings: data.driverEarnings || round2(((data.fareTotal || 0) / (1 + IVA_RATE)) * DRIVER_RATE),
    platformFee: data.platformFee || 0,
    paymentMethod: data.paymentMethod || 'cash',
    paymentStatus: data.paymentStatus || 'pending',
    paymentGateway: data.paymentGateway,
    transactionId: data.transactionId,
    invoiceId: data.invoiceId,
    requestedAt: data.requestedAt?.toDate?.() || new Date(),
    startedAt: data.startedAt?.toDate?.(),
    completedAt: data.completedAt?.toDate?.(),
    cancelledAt: data.cancelledAt?.toDate?.(),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
