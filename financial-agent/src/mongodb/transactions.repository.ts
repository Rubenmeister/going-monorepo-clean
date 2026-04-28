/**
 * Transactions repository — lee la collection `transactions` de
 * MongoDB Atlas (DB going-payments) escrita por payment-service.
 *
 * Schema real:
 *   id           string (unique)
 *   userId       string (passenger uid)
 *   referenceId  string (típicamente el rideId)
 *   paymentIntentId?  string  (Datafast / gateway id)
 *   amount       { amount: number, currency: string }   ← objeto anidado
 *   status       'pending' | 'succeeded' | 'failed'
 *   createdAt    Date
 *
 * Lo traducimos al tipo PaymentTransaction que el agente espera.
 */
import { getTransactionsDb } from './connection';
import { PaymentTransaction } from '../types/financial.types';

interface MongoTransaction {
  id?:                 string;
  _id?:                any;
  userId?:             string;
  referenceId?:        string;
  paymentIntentId?:    string;
  amount?:             { amount?: number; currency?: string };
  status?:             string;
  createdAt?:          Date;
  updatedAt?:          Date;
}

function toPaymentTransaction(doc: MongoTransaction): PaymentTransaction {
  return {
    id:                  doc.id || String(doc._id || ''),
    rideId:              doc.referenceId || '',
    gateway:             doc.paymentIntentId ? 'datafast' : 'unknown',
    amount:              doc.amount?.amount || 0,
    currency:            (doc.amount?.currency as 'USD') || 'USD',
    // Mongo usa 'succeeded'/'failed'/'pending'; el agente usa 'captured'/'failed'/etc.
    status:              mapStatus(doc.status),
    gatewayTransactionId: doc.paymentIntentId,
    createdAt:           doc.createdAt || new Date(),
    updatedAt:           doc.updatedAt || doc.createdAt || new Date(),
  };
}

function mapStatus(s?: string): PaymentTransaction['status'] {
  switch (s) {
    case 'succeeded': return 'captured';
    case 'failed':    return 'failed';
    case 'pending':   return 'pending';
    default:          return 'pending';
  }
}

/** Transacciones capturadas (status='succeeded') en un rango. */
export async function mongoGetCapturedTransactions(from: Date, to: Date): Promise<PaymentTransaction[]> {
  const db = await getTransactionsDb();
  const docs = await db.collection<MongoTransaction>('transactions')
    .find({
      status: 'succeeded',
      createdAt: { $gte: from, $lte: to },
    })
    .toArray();
  return docs.map(toPaymentTransaction);
}

/** Transacciones fallidas (status='failed') en un rango. */
export async function mongoGetFailedTransactions(from: Date, to: Date): Promise<PaymentTransaction[]> {
  const db = await getTransactionsDb();
  const docs = await db.collection<MongoTransaction>('transactions')
    .find({
      status: 'failed',
      createdAt: { $gte: from, $lte: to },
    })
    .toArray();
  return docs.map(toPaymentTransaction);
}

/** Stats agregados de pagos en un rango. */
export async function mongoGetPaymentStats(from: Date, to: Date): Promise<{
  total:       number;
  failed:      number;
  failureRate: number;
  byErrorCode: Record<string, number>;
}> {
  const db = await getTransactionsDb();
  const all    = await db.collection<MongoTransaction>('transactions')
    .countDocuments({ createdAt: { $gte: from, $lte: to } });
  const failed = await db.collection<MongoTransaction>('transactions')
    .countDocuments({ status: 'failed', createdAt: { $gte: from, $lte: to } });

  return {
    total:       all,
    failed,
    failureRate: all > 0 ? (failed / all) * 100 : 0,
    byErrorCode: {},   // El schema actual no almacena errorCode; refinable si payment-service lo agrega
  };
}
