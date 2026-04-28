import { Firestore, Timestamp } from '@google-cloud/firestore';
import { getCompletedRides } from '../firestore/financial.service';
import { mongoGetCapturedTransactions } from '../mongodb/transactions.repository';

// ============================================================
// Bank Reconciliation – Conciliación bancaria (Día 5)
//
// Cruza transacciones reales (going-payments.transactions con status
// succeeded) vs rides completados (going-bookings.rides con paymentRef
// presente). Detecta:
//   - Pagos sin viaje asociado
//   - Viajes en tarjeta sin pago capturado
//   - Diferencias de monto > $0.01
//   - Pagos duplicados (mismo gateway txn id en 2+ rides)
//
// Persiste el resultado en Firestore `reconciliation_reports` para
// auditoría y para que el dashboard pueda mostrarlo histórico.
// ============================================================

const fs = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

export interface ReconciliationResult {
  date: Date;
  totalTransactions: number;
  totalAmount: number;

  paymentsWithoutRide: ReconciliationIssue[];
  ridesWithoutPayment: ReconciliationIssue[];
  amountMismatches:    ReconciliationIssue[];
  duplicatePayments:   ReconciliationIssue[];

  issueCount:      number;
  isBalanced:      boolean;
  expectedBalance: number;
  variance:        number;
}

export interface ReconciliationIssue {
  type: 'payment_without_ride' | 'ride_without_payment' | 'amount_mismatch' | 'duplicate';
  severity: 'warning' | 'critical';
  rideId?: string;
  transactionId?: string;
  expectedAmount?: number;
  actualAmount?: number;
  description: string;
}

export async function reconcileDay(date?: Date): Promise<ReconciliationResult> {
  const d    = date || new Date();
  const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  console.log(`[reconciliation] Conciliando ${from.toLocaleDateString('es-EC')}`);

  // Lectura paralela: Mongo rides (Día 1) + Mongo transactions (Día 5)
  const [rides, transactions] = await Promise.all([
    getCompletedRides(from, to),
    mongoGetCapturedTransactions(from, to),
  ]);

  const issues: ReconciliationIssue[] = [];

  // ── 1. Pagos sin viaje asociado ───────────────────────────
  const rideIds = new Set(rides.map(r => r.id));
  for (const tx of transactions) {
    if (tx.rideId && !rideIds.has(tx.rideId)) {
      issues.push({
        type:           'payment_without_ride',
        severity:       'critical',
        transactionId:  tx.id,
        rideId:         tx.rideId,
        actualAmount:   tx.amount,
        description:    `Pago ${tx.id} de $${tx.amount} sin viaje asociado (rideId: ${tx.rideId})`,
      });
    }
  }

  // ── 2. Viajes en tarjeta sin pago capturado ───────────────
  const txRideIds = new Set(transactions.map(t => t.rideId).filter(Boolean));
  for (const ride of rides) {
    if (ride.paymentMethod === 'card' && ride.paymentStatus !== 'captured' && !txRideIds.has(ride.id)) {
      issues.push({
        type:           'ride_without_payment',
        severity:       'critical',
        rideId:         ride.id,
        expectedAmount: ride.fareTotal,
        description:    `Viaje ${ride.id.slice(-6)} completado ($${ride.fareTotal}) sin pago capturado`,
      });
    }
  }

  // ── 3. Diferencias de monto ───────────────────────────────
  const txByRide = new Map<string, typeof transactions[number]>();
  transactions.forEach(t => { if (t.rideId) txByRide.set(t.rideId, t); });

  for (const ride of rides) {
    const tx = txByRide.get(ride.id);
    if (tx && Math.abs(tx.amount - ride.fareTotal) > 0.01) {
      issues.push({
        type:           'amount_mismatch',
        severity:       'critical',
        rideId:         ride.id,
        transactionId:  tx.id,
        expectedAmount: ride.fareTotal,
        actualAmount:   tx.amount,
        description:    `Monto diferente en viaje ${ride.id.slice(-6)}: ride $${ride.fareTotal} vs txn $${tx.amount}`,
      });
    }
  }

  // ── 4. Pagos duplicados ───────────────────────────────────
  const txIdCount = new Map<string, number>();
  transactions.forEach(t => {
    const gw = t.gatewayTransactionId;
    if (gw) txIdCount.set(gw, (txIdCount.get(gw) || 0) + 1);
  });
  txIdCount.forEach((count, gatewayId) => {
    if (count > 1) {
      issues.push({
        type:          'duplicate',
        severity:      'critical',
        transactionId: gatewayId,
        description:   `Transacción duplicada ${gatewayId} aparece ${count} veces`,
      });
    }
  });

  const totalAmount     = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const expectedBalance = rides
    .filter(r => r.paymentMethod === 'card')
    .reduce((s, r) => s + (r.fareTotal || 0), 0);
  const variance        = totalAmount - expectedBalance;

  const result: ReconciliationResult = {
    date: from,
    totalTransactions:   transactions.length,
    totalAmount:         round2(totalAmount),
    paymentsWithoutRide: issues.filter(i => i.type === 'payment_without_ride'),
    ridesWithoutPayment: issues.filter(i => i.type === 'ride_without_payment'),
    amountMismatches:    issues.filter(i => i.type === 'amount_mismatch'),
    duplicatePayments:   issues.filter(i => i.type === 'duplicate'),
    issueCount:          issues.length,
    isBalanced:          issues.length === 0 && Math.abs(variance) < 0.01,
    expectedBalance:     round2(expectedBalance),
    variance:            round2(variance),
  };

  // Persistir el reporte en Firestore para histórico/auditoría
  await fs.collection('reconciliation_reports').add({
    ...result,
    date:      Timestamp.fromDate(from),
    issues,
    createdAt: Timestamp.now(),
  });

  console.log(`[reconciliation] Done: ${issues.length} issues, variance: $${variance.toFixed(2)}`);
  return result;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
