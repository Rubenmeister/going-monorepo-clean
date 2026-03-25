import { Firestore, Timestamp } from '@google-cloud/firestore';

// ============================================================
// Bank Reconciliation – Conciliación bancaria
// Compara pagos capturados en Datafast vs Firestore
// Detecta: pagos sin viaje, viajes sin pago, diferencias de monto
// ============================================================

const db = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

export interface ReconciliationResult {
  date: Date;
  totalTransactions: number;
  totalAmount: number;

  // Diferencias encontradas
  paymentsWithoutRide: ReconciliationIssue[];   // Pago en Datafast sin viaje en Firestore
  ridesWithoutPayment: ReconciliationIssue[];   // Viaje completado sin pago capturado
  amountMismatches: ReconciliationIssue[];      // Monto diferente entre Datafast y Firestore
  duplicatePayments: ReconciliationIssue[];     // Mismo transactionId en 2 viajes

  // Resumen
  issueCount: number;
  isBalanced: boolean;
  expectedBalance: number;   // Lo que debería estar en banco
  variance: number;          // Diferencia encontrada
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

// ─── Conciliación diaria ──────────────────────────────────────
export async function reconcileDay(date?: Date): Promise<ReconciliationResult> {
  const d    = date || new Date();
  const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  console.log(`[reconciliation] Reconciling ${from.toLocaleDateString('es-EC')}`);

  // Obtener viajes completados del día
  const ridesSnap = await db.collection('rides')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', Timestamp.fromDate(from))
    .where('completedAt', '<=', Timestamp.fromDate(to))
    .get();

  // Obtener transacciones de pago del día
  const txSnap = await db.collection('payment_transactions')
    .where('status', '==', 'captured')
    .where('createdAt', '>=', Timestamp.fromDate(from))
    .where('createdAt', '<=', Timestamp.fromDate(to))
    .get();

  const rides = ridesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const issues: ReconciliationIssue[] = [];

  // ── 1. Pagos sin viaje asociado ───────────────────────────
  const rideIds = new Set(rides.map((r: Record<string, unknown>) => r.id));
  for (const tx of transactions) {
    const t = tx as Record<string, unknown>;
    if (t.rideId && !rideIds.has(t.rideId)) {
      issues.push({
        type: 'payment_without_ride',
        severity: 'critical',
        transactionId: t.id as string,
        rideId: t.rideId as string,
        actualAmount: t.amount as number,
        description: `Pago ${t.id} de $${t.amount} no tiene viaje asociado (rideId: ${t.rideId})`,
      });
    }
  }

  // ── 2. Viajes sin pago capturado ──────────────────────────
  const txRideIds = new Set(transactions.map((t: Record<string, unknown>) => t.rideId));
  for (const ride of rides) {
    const r = ride as Record<string, unknown>;
    if (r.paymentMethod === 'card' && r.paymentStatus !== 'captured' && !txRideIds.has(r.id)) {
      issues.push({
        type: 'ride_without_payment',
        severity: 'critical',
        rideId: r.id as string,
        expectedAmount: r.fareTotal as number,
        description: `Viaje ${r.id} completado ($${r.fareTotal}) sin pago capturado`,
      });
    }
  }

  // ── 3. Diferencias de monto ───────────────────────────────
  const txByRide = new Map<string, Record<string, unknown>>();
  transactions.forEach((t: Record<string, unknown>) => {
    if (t.rideId) txByRide.set(t.rideId as string, t);
  });

  for (const ride of rides) {
    const r = ride as Record<string, unknown>;
    const tx = txByRide.get(r.id as string);
    if (tx && Math.abs((tx.amount as number) - (r.fareTotal as number)) > 0.01) {
      issues.push({
        type: 'amount_mismatch',
        severity: 'critical',
        rideId: r.id as string,
        transactionId: tx.id as string,
        expectedAmount: r.fareTotal as number,
        actualAmount: tx.amount as number,
        description: `Monto diferente en viaje ${r.id}: Firestore $${r.fareTotal} vs Datafast $${tx.amount}`,
      });
    }
  }

  // ── 4. Pagos duplicados ───────────────────────────────────
  const txIdCount = new Map<string, number>();
  transactions.forEach((t: Record<string, unknown>) => {
    const gatewayId = t.gatewayTransactionId as string;
    if (gatewayId) txIdCount.set(gatewayId, (txIdCount.get(gatewayId) || 0) + 1);
  });
  txIdCount.forEach((count, gatewayId) => {
    if (count > 1) {
      issues.push({
        type: 'duplicate',
        severity: 'critical',
        transactionId: gatewayId,
        description: `Transacción duplicada ${gatewayId} aparece ${count} veces`,
      });
    }
  });

  const totalAmount = transactions.reduce((s: number, t: Record<string, unknown>) => s + (t.amount as number || 0), 0);
  const expectedBalance = rides
    .filter((r: Record<string, unknown>) => r.paymentMethod === 'card')
    .reduce((s: number, r: Record<string, unknown>) => s + (r.fareTotal as number || 0), 0);
  const variance = totalAmount - expectedBalance;

  const result: ReconciliationResult = {
    date: from,
    totalTransactions: transactions.length,
    totalAmount: round2(totalAmount),
    paymentsWithoutRide: issues.filter(i => i.type === 'payment_without_ride'),
    ridesWithoutPayment: issues.filter(i => i.type === 'ride_without_payment'),
    amountMismatches:   issues.filter(i => i.type === 'amount_mismatch'),
    duplicatePayments:  issues.filter(i => i.type === 'duplicate'),
    issueCount: issues.length,
    isBalanced: issues.length === 0 && Math.abs(variance) < 0.01,
    expectedBalance: round2(expectedBalance),
    variance: round2(variance),
  };

  // Guardar resultado en Firestore
  await db.collection('reconciliation_reports').add({
    ...result,
    date: Timestamp.fromDate(from),
    issues,
    createdAt: Timestamp.now(),
  });

  console.log(`[reconciliation] Done: ${issues.length} issues, variance: $${variance.toFixed(2)}`);
  return result;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
