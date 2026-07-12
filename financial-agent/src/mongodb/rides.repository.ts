/**
 * Rides repository — lee la collection `rides` real de MongoDB Atlas
 * (escrita por transport-service).
 *
 * El financial-agent fue escrito originalmente para Firestore con un schema
 * propio (campos planos como fareTotal, paymentStatus, etc.). El schema
 * real de MongoDB tiene estructura distinta (fare/finalFare como Object,
 * paymentMethod en raíz, sin paymentStatus explícito).
 *
 * Este archivo traduce documentos de Mongo a el tipo Ride que el agente
 * espera, derivando campos cuando es necesario.
 */
import { Filter } from 'mongodb';
import { Ride, GOING_COMMISSION_RATE, DRIVER_RATE, IVA_RATE } from '../types/financial.types';
import { getRidesDb } from './connection';

const round2 = (n: number) => Math.round(n * 100) / 100;

interface MongoRide {
  _id: any;
  userId?: string;
  driverId?: string;
  bookingId?: string;
  status?: string;
  pickupLocation?: { address?: string };
  dropoffLocation?: { address?: string };
  fare?:      { total?: number; estimatedTotal?: number; subtotal?: number; iva?: number };
  finalFare?: { total?: number };
  requestedAt?: Date;
  completedAt?: Date;
  distanceKm?: number;
  paymentMethod?: string;       // 'card' | 'transfer' | 'cash'
  paymentRef?: string;          // gateway reference
  paymentTxnId?: string;        // payment-service txn id
  cashConfirmed?: boolean;      // driver received cash
  modalidad?: string;           // 'compartido' | 'privado'
  serviceType?: string;
  paymentCaptureStatus?: string;   // 'captured' | 'failed' (captura del cobro digital al completar)
  paymentCaptureFailedAt?: Date;
}

/**
 * Deriva paymentStatus a partir del schema real:
 *   - cash + cashConfirmed=true        → 'captured'
 *   - cash + cashConfirmed=false       → 'pending'
 *   - card/transfer + paymentRef set   → 'captured' (asumimos capturado al
 *     existir referencia del gateway; refinable consultando payment-service)
 *   - card/transfer + sin paymentRef   → 'pending'
 *   - status==='cancelled'             → 'cancelled'
 */
function derivePaymentStatus(doc: MongoRide): string {
  if (doc.status === 'cancelled') return 'cancelled';
  const method = doc.paymentMethod || 'cash';
  if (method === 'cash') {
    return doc.cashConfirmed ? 'captured' : 'pending';
  }
  // card / transfer
  return doc.paymentRef ? 'captured' : 'pending';
}

function toRide(doc: MongoRide): Ride {
  const fareTotal = doc.finalFare?.total ?? doc.fare?.total ?? doc.fare?.estimatedTotal ?? 0;
  const fareSubtotal = doc.fare?.subtotal ?? round2(fareTotal / (1 + IVA_RATE));
  const ivaAmount    = doc.fare?.iva ?? round2(fareTotal - fareSubtotal);

  return {
    id:               String(doc._id),
    driverId:         doc.driverId || '',
    passengerId:      doc.userId || '',
    status:           (doc.status || 'requested') as Ride['status'],
    rideType:         (doc.modalidad === 'compartido' ? 'shared' : 'private') as Ride['rideType'],
    origin:           doc.pickupLocation?.address || '',
    destination:      doc.dropoffLocation?.address || '',
    distanceKm:       doc.distanceKm || 0,
    fareTotal:        round2(fareTotal),
    fareSubtotal,
    ivaAmount,
    goingCommission:  round2(fareTotal * GOING_COMMISSION_RATE),
    driverEarnings:   round2(fareTotal * DRIVER_RATE),
    platformFee:      0,
    paymentMethod:    (doc.paymentMethod || 'cash') as Ride['paymentMethod'],
    paymentStatus:    derivePaymentStatus(doc) as Ride['paymentStatus'],
    paymentGateway:   undefined,
    transactionId:    doc.paymentTxnId,
    requestedAt:      doc.requestedAt ? new Date(doc.requestedAt) : new Date(0),
    completedAt:      doc.completedAt ? new Date(doc.completedAt) : undefined,
    invoiceId:        undefined,
  };
}

// ─── Read helpers ──────────────────────────────────────────────

export async function mongoGetCompletedRides(from: Date, to: Date): Promise<Ride[]> {
  const db = await getRidesDb();
  const filter: Filter<MongoRide> = {
    status: 'completed',
    completedAt: { $gte: from, $lte: to },
  };
  const docs = await db.collection<MongoRide>('rides')
    .find(filter)
    .sort({ completedAt: -1 })
    .toArray();
  return docs.map(toRide);
}

export async function mongoGetRidesByDriver(driverId: string, from: Date, to: Date): Promise<Ride[]> {
  const db = await getRidesDb();
  const docs = await db.collection<MongoRide>('rides')
    .find({
      driverId,
      status: 'completed',
      completedAt: { $gte: from, $lte: to },
    })
    .toArray();
  return docs.map(toRide);
}

/**
 * Pagos pendientes = rides con status='completed' pero pago no confirmado.
 *   - cash sin cashConfirmed
 *   - card/transfer sin paymentRef
 */
export async function mongoGetPendingPayments(): Promise<Ride[]> {
  const db = await getRidesDb();
  const docs = await db.collection<MongoRide>('rides')
    .find({
      status: 'completed',
      $or: [
        { paymentMethod: 'cash', cashConfirmed: { $ne: true } },
        { paymentMethod: { $in: ['card', 'transfer'] }, paymentRef: { $exists: false } },
        { paymentMethod: { $in: ['card', 'transfer'] }, paymentRef: '' },
      ],
    })
    .toArray();
  return docs.map(toRide);
}

/**
 * Pagos fallidos REALES = rides cuya captura de cobro digital falló al
 * completar (paymentCaptureStatus='failed', escrito por transport-service).
 * Fuente autoritativa de "pago fallido" (antes getFailedPayments retornaba []).
 */
export async function mongoGetFailedCapturePayments(from: Date, to: Date): Promise<Ride[]> {
  const db = await getRidesDb();
  const docs = await db.collection<MongoRide>('rides')
    .find({
      paymentCaptureStatus: 'failed',
      paymentCaptureFailedAt: { $gte: from, $lte: to },
    })
    .sort({ paymentCaptureFailedAt: -1 })
    .toArray();
  return docs.map(toRide);
}

/**
 * Rides sin factura emitida con pago capturado (candidatos a invoicing).
 * Se usa el campo `invoiceId` que el agente mismo escribirá tras invoicear.
 */
export async function mongoGetRidesPendingInvoice(limit = 50): Promise<Ride[]> {
  const db = await getRidesDb();
  const docs = await db.collection<MongoRide>('rides')
    .find({
      status: 'completed',
      $or: [
        { paymentMethod: 'cash', cashConfirmed: true },
        { paymentMethod: { $in: ['card', 'transfer'] }, paymentRef: { $exists: true, $ne: '' } },
      ],
      // invoiceId no existe o es null
      $and: [
        { $or: [{ invoiceId: { $exists: false } }, { invoiceId: null }] },
      ],
    })
    .sort({ completedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toRide);
}

/**
 * Marca un ride como facturado escribiendo invoiceId + invoicedAt.
 * Se llama tras emitir factura exitosa en Datil.
 */
export async function mongoUpdateRideInvoice(rideId: string, invoiceId: string): Promise<void> {
  const db = await getRidesDb();
  // El _id en Mongo es ObjectId, pero el rideId que viene puede ser string
  const { ObjectId } = await import('mongodb');
  const _id: any = ObjectId.isValid(rideId) ? new ObjectId(rideId) : rideId;
  await db.collection('rides').updateOne(
    { _id },
    { $set: { invoiceId, invoicedAt: new Date() } },
  );
}
