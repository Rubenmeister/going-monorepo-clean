import { Firestore, Timestamp } from '@google-cloud/firestore';
import { createInvoice, getInvoiceStatus } from './client';
import { updateRideInvoice } from '../firestore/financial.service';

// ============================================================
// Invoice Retry – Reintento automático de facturas fallidas
// Detecta viajes completados sin factura → reintenta emisión
// Máx 3 intentos por viaje, espera 1h entre intentos
// ============================================================

const db = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });
const MAX_ATTEMPTS = 3;
const RETRY_HOURS  = 1;

interface InvoiceFailure {
  rideId: string;
  attempts: number;
  lastAttempt: Date;
  lastError: string;
}

// ─── Obtener viajes sin factura ───────────────────────────────
async function getRidesWithoutInvoice(limit = 50): Promise<Array<Record<string, unknown>>> {
  const snap = await db.collection('rides')
    .where('status', '==', 'completed')
    .where('invoiceId', '==', null)
    .where('paymentStatus', '==', 'captured')
    .orderBy('completedAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Obtener intentos fallidos previos ────────────────────────
async function getInvoiceAttempts(rideId: string): Promise<InvoiceFailure | null> {
  const snap = await db.collection('invoice_failures')
    .where('rideId', '==', rideId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].data() as InvoiceFailure;
}

async function recordFailure(rideId: string, error: string, existing: InvoiceFailure | null): Promise<void> {
  const data = {
    rideId,
    attempts: (existing?.attempts || 0) + 1,
    lastAttempt: Timestamp.now(),
    lastError: error,
  };

  if (existing) {
    const snap = await db.collection('invoice_failures').where('rideId', '==', rideId).limit(1).get();
    if (!snap.empty) await snap.docs[0].ref.update(data);
  } else {
    await db.collection('invoice_failures').add(data);
  }
}

async function clearFailure(rideId: string): Promise<void> {
  const snap = await db.collection('invoice_failures').where('rideId', '==', rideId).limit(1).get();
  if (!snap.empty) await snap.docs[0].ref.delete();
}

// ─── Runner principal ─────────────────────────────────────────
export interface RetryResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;    // Max intentos alcanzado
  errors: Array<{ rideId: string; error: string }>;
}

export async function retryFailedInvoices(): Promise<RetryResult> {
  console.log('[invoice-retry] Checking for rides without invoices...');

  const rides = await getRidesWithoutInvoice();
  const result: RetryResult = { processed: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] };

  if (rides.length === 0) {
    console.log('[invoice-retry] All rides are invoiced ✅');
    return result;
  }

  console.log(`[invoice-retry] Found ${rides.length} rides without invoice`);

  for (const ride of rides) {
    const r = ride as Record<string, unknown>;
    result.processed++;

    // Verificar intentos previos
    const prevFailure = await getInvoiceAttempts(r.id as string);

    if (prevFailure) {
      // Saltar si excedió intentos máximos
      if (prevFailure.attempts >= MAX_ATTEMPTS) {
        console.log(`[invoice-retry] Ride ${r.id} skipped — max attempts reached`);
        result.skipped++;
        continue;
      }

      // Esperar 1h entre intentos
      const hoursSinceLast = (Date.now() - new Date(prevFailure.lastAttempt).getTime()) / 3600000;
      if (hoursSinceLast < RETRY_HOURS) {
        result.skipped++;
        continue;
      }
    }

    // Intentar emitir factura
    try {
      const passengerData = await getPassengerData(r.passengerId as string);

      const fareTotal    = r.fareTotal as number || 0;
      const ivaRate      = 0.15;
      const fareSubtotal = round2(fareTotal / (1 + ivaRate));
      const ivaAmount    = round2(fareTotal - fareSubtotal);

      const invoice = await createInvoice({
        rideId:                r.id as string,
        passengerName:         passengerData.name,
        passengerEmail:        passengerData.email,
        passengerIdentification: passengerData.identification || '9999999999999',
        identificationType:    passengerData.ruc ? '04' : '05',
        fareSubtotal,
        ivaAmount,
        fareTotal,
        description: `Servicio de transporte: ${r.origin || 'Origen'} → ${r.destination || 'Destino'}`,
      });

      await updateRideInvoice(r.id as string, invoice.id);
      await clearFailure(r.id as string);

      result.succeeded++;
      console.log(`[invoice-retry] ✅ Ride ${r.id} invoiced: ${invoice.id}`);

    } catch (err) {
      const errMsg = (err as Error).message;
      await recordFailure(r.id as string, errMsg, prevFailure);
      result.failed++;
      result.errors.push({ rideId: r.id as string, error: errMsg });
      console.error(`[invoice-retry] ❌ Ride ${r.id} failed: ${errMsg}`);
    }
  }

  console.log(`[invoice-retry] Done: ${result.succeeded} OK, ${result.failed} failed, ${result.skipped} skipped`);
  return result;
}

// ─── Verificar facturas emitidas pero no autorizadas por SRI ──
export async function checkPendingAuthorization(): Promise<number> {
  const snap = await db.collection('invoices')
    .where('status', '==', 'draft')
    .where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 2 * 3600 * 1000)))
    .get();

  let authorized = 0;
  for (const doc of snap.docs) {
    const invoiceId = doc.data().datilId;
    if (!invoiceId) continue;

    try {
      const status = await getInvoiceStatus(invoiceId);
      if (status.estado === 'AUTORIZADO') {
        await doc.ref.update({ status: 'authorized', authorizedAt: Timestamp.now() });
        authorized++;
      }
    } catch (e) {
      console.error(`[invoice-retry] Status check failed for ${invoiceId}:`, e);
    }
  }

  if (authorized > 0) console.log(`[invoice-retry] ${authorized} invoices authorized by SRI`);
  return authorized;
}

// ─── Helper: obtener datos del pasajero ───────────────────────
async function getPassengerData(passengerId: string): Promise<{
  name: string; email: string; identification?: string; ruc?: string;
}> {
  try {
    const snap = await db.collection('users').doc(passengerId).get();
    if (snap.exists) {
      const data = snap.data() || {};
      return {
        name:           data.displayName || data.name || 'Consumidor Final',
        email:          data.email || 'consumidor@final.com',
        identification: data.cedula || data.identification,
        ruc:            data.ruc,
      };
    }
  } catch (e) {
    console.error(`[invoice-retry] Could not fetch passenger ${passengerId}`);
  }
  return { name: 'Consumidor Final', email: 'consumidor@final.com' };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
