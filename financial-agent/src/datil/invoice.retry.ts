import { Firestore, Timestamp } from '@google-cloud/firestore';
import { createInvoice, getInvoiceStatus } from './client';
import { getRidesPendingInvoice, updateRideInvoice } from '../firestore/financial.service';
import { mongoGetPassenger } from '../mongodb/users.repository';
import { Ride } from '../types/financial.types';

// ============================================================
// Invoice Loop – Día 2
// Detecta rides completados con pago capturado y aún sin facturar
// (lectura desde MongoDB Atlas vía financial.service), llama a Datil,
// persiste el comprobante en Firestore y marca el ride en Mongo.
//
// Política de reintentos: máx 3 intentos por ride, espera 1h entre
// intentos. El estado de fallos vive en Firestore `invoice_failures`
// (estado interno del agente, no datos de negocio).
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

// ─── Tracking de fallos previos ───────────────────────────────

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

// ─── Persistencia de comprobantes ─────────────────────────────

async function saveInvoiceRecord(input: {
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  identification: string;
  identificationType: string;
  fareSubtotal: number;
  ivaAmount: number;
  fareTotal: number;
  datilId: string;
  secuencial?: string;
  claveAcceso?: string;
  pdfUrl?: string;
  xmlUrl?: string;
}): Promise<void> {
  await db.collection('invoices').add({
    datilId:            input.datilId,
    rideId:             input.rideId,
    passengerId:        input.passengerId,
    passengerName:      input.passengerName,
    passengerEmail:     input.passengerEmail,
    identification:     input.identification,
    identificationType: input.identificationType,
    subtotal:           input.fareSubtotal,
    iva:                input.ivaAmount,
    total:              input.fareTotal,
    currency:           'USD',
    status:             'draft', // pasa a 'authorized' cuando el SRI confirma (checkPendingAuthorization)
    secuencial:         input.secuencial || null,
    claveAcceso:        input.claveAcceso || null,
    pdfUrl:             input.pdfUrl || null,
    xmlUrl:             input.xmlUrl || null,
    createdAt:          Timestamp.now(),
  });
}

// ─── Runner principal ─────────────────────────────────────────

export interface RetryResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  succeededDetails: Array<{ rideId: string; total: number; secuencial?: string }>;
  errors:           Array<{ rideId: string; error: string }>;
}

export async function retryFailedInvoices(): Promise<RetryResult> {
  console.log('[invoice-loop] Buscando rides pendientes de facturar...');

  const rides = await getRidesPendingInvoice(50);
  const result: RetryResult = {
    processed:        0,
    succeeded:        0,
    failed:           0,
    skipped:          0,
    succeededDetails: [],
    errors:           [],
  };

  if (rides.length === 0) {
    console.log('[invoice-loop] Sin rides pendientes — todos facturados ✅');
    return result;
  }

  console.log(`[invoice-loop] ${rides.length} rides candidatos a facturación`);

  for (const ride of rides) {
    result.processed++;

    // Validación temprana: necesitamos un fareTotal positivo
    if (!ride.fareTotal || ride.fareTotal <= 0) {
      console.log(`[invoice-loop] ⏭️  ride ${ride.id} sin fareTotal válido (${ride.fareTotal}) — skip`);
      result.skipped++;
      continue;
    }

    const prevFailure = await getInvoiceAttempts(ride.id);

    if (prevFailure) {
      if (prevFailure.attempts >= MAX_ATTEMPTS) {
        console.log(`[invoice-loop] ⏭️  ride ${ride.id} skipped — max attempts (${prevFailure.attempts})`);
        result.skipped++;
        continue;
      }
      const hoursSinceLast = (Date.now() - new Date(prevFailure.lastAttempt).getTime()) / 3600000;
      if (hoursSinceLast < RETRY_HOURS) {
        result.skipped++;
        continue;
      }
    }

    try {
      const success = await invoiceSingleRide(ride);
      result.succeeded++;
      result.succeededDetails.push({
        rideId:     ride.id,
        total:      ride.fareTotal,
        secuencial: success.secuencial,
      });
      await clearFailure(ride.id);
      console.log(`[invoice-loop] ✅ ride ${ride.id} facturado: ${success.datilId} (sec ${success.secuencial})`);
    } catch (err) {
      const errMsg = (err as Error).message;
      await recordFailure(ride.id, errMsg, prevFailure);
      result.failed++;
      result.errors.push({ rideId: ride.id, error: errMsg });
      console.error(`[invoice-loop] ❌ ride ${ride.id} falló: ${errMsg}`);
    }
  }

  console.log(`[invoice-loop] Done: ${result.succeeded} OK, ${result.failed} failed, ${result.skipped} skipped`);
  return result;
}

/**
 * Factura un solo ride. Lanza si Datil rechaza la emisión.
 * En éxito: persiste en Firestore `invoices` + marca el ride en Mongo
 * con el invoiceId para que el siguiente run no lo re-procese.
 */
async function invoiceSingleRide(ride: Ride): Promise<{
  datilId: string;
  secuencial?: string;
}> {
  const passenger = await mongoGetPassenger(ride.passengerId);

  const invoice = await createInvoice({
    rideId:                  ride.id,
    passengerName:           passenger.name,
    passengerEmail:          passenger.email,
    passengerIdentification: passenger.identification,
    identificationType:      passenger.identificationType,
    fareSubtotal:            ride.fareSubtotal,
    ivaAmount:               ride.ivaAmount,
    fareTotal:               ride.fareTotal,
    description:             buildDescription(ride),
    paymentMedio:            ride.paymentMethod,
  });

  // Persistir el comprobante para auditoría y para checkPendingAuthorization
  await saveInvoiceRecord({
    rideId:             ride.id,
    passengerId:        ride.passengerId,
    passengerName:      passenger.name,
    passengerEmail:     passenger.email,
    identification:     passenger.identification,
    identificationType: passenger.identificationType,
    fareSubtotal:       ride.fareSubtotal,
    ivaAmount:          ride.ivaAmount,
    fareTotal:          ride.fareTotal,
    datilId:            invoice.id,
    secuencial:         invoice.secuencial,
    claveAcceso:        invoice.clave_acceso,
    pdfUrl:             invoice.pdf,
    xmlUrl:             invoice.xml,
  });

  // Marcar el ride en Mongo para que no se re-facture
  await updateRideInvoice(ride.id, invoice.id);

  return { datilId: invoice.id, secuencial: invoice.secuencial };
}

function buildDescription(ride: Ride): string {
  const origin = ride.origin || 'Origen';
  const dest   = ride.destination || 'Destino';
  return `Servicio de transporte: ${origin} -> ${dest}`;
}

// ─── Verificar facturas emitidas pero no autorizadas por SRI ──
//
// Datil emite el comprobante inmediatamente pero la autorización del SRI
// puede tardar segundos a minutos. Cada run del agente revisa los `draft`
// de las últimas 2 horas y pregunta a Datil su estado actual.

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
        await doc.ref.update({
          status:        'authorized',
          authorizedAt:  Timestamp.now(),
          claveAcceso:   status.clave_acceso || doc.data().claveAcceso,
        });
        authorized++;
      }
    } catch (e) {
      console.error(`[invoice-loop] status check failed para ${invoiceId}:`, (e as Error).message);
    }
  }

  if (authorized > 0) console.log(`[invoice-loop] ${authorized} facturas autorizadas por el SRI`);
  return authorized;
}
