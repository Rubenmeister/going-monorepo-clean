/**
 * Modo de prueba E2E: inserta un ride en MongoDB Atlas, espera a que el
 * loop de facturación lo procese, y limpia.
 *
 * Activación:
 *   TEST_SEED=1                           → seed + run + cleanup ride
 *   TEST_SEED=1 + DATIL_ENV=2 (producción) → además anula la factura
 *     emitida vía Datil (cancelInvoice) para que no contamine el SRI
 *
 * Por defecto el seed crea un ride completed con pago en efectivo
 * confirmado, valor $25 USD, ruta de prueba, modalidad privado.
 */
import { ObjectId } from 'mongodb';
import { getRidesDb } from '../mongodb/connection';
import { cancelInvoice } from '../datil/client';

export interface SeededRide {
  _id:       string;
  fareTotal: number;
  scenario:  string;
}

export async function seedTestRide(): Promise<SeededRide> {
  const db = await getRidesDb();
  const completedAt = new Date(Date.now() - 5 * 60 * 1000); // hace 5 min

  const doc = {
    userId:        'TEST_PASSENGER_001',
    driverId:      'TEST_DRIVER_001',
    bookingId:     `TEST_BOOKING_${Date.now()}`,
    status:        'completed',
    pickupLocation:  { address: 'Av. Amazonas y Naciones Unidas, Quito (TEST)' },
    dropoffLocation: { address: 'Aeropuerto Mariscal Sucre, Tababela (TEST)' },
    fare: {
      total:    1.00,
      subtotal: 0.87,    // 25 / 1.15
      iva:       0.13,    // 25 - 0.87
    },
    finalFare:     { total: 1.00 },
    distanceKm:    18.4,
    paymentMethod: 'cash',
    cashConfirmed: true,
    modalidad:     'privado',
    serviceType:   'transport',
    requestedAt:   new Date(completedAt.getTime() - 30 * 60 * 1000),
    completedAt,
    __testSeed:    true,         // marca para identificarlo y limpiarlo
  };

  const result = await db.collection('rides').insertOne(doc as any);
  console.log(`[test-seed] inserted ride ${result.insertedId} ($${doc.fare.total})`);
  return {
    _id:       String(result.insertedId),
    fareTotal: doc.fare.total,
    scenario:  'cash-confirmed',
  };
}

export async function cleanupTestRides(): Promise<number> {
  const db = await getRidesDb();
  const result = await db.collection('rides').deleteMany({ __testSeed: true });
  if (result.deletedCount > 0) {
    console.log(`[test-seed] cleanup: ${result.deletedCount} test ride(s) eliminados`);
  }
  return result.deletedCount || 0;
}

export async function showTestRideStatus(rideId: string): Promise<string | null> {
  const db = await getRidesDb();
  const _id = ObjectId.isValid(rideId) ? new ObjectId(rideId) : rideId;
  const ride = await db.collection('rides').findOne({ _id: _id as any });
  if (!ride) {
    console.log(`[test-seed] ride ${rideId} no encontrado tras facturar`);
    return null;
  }
  console.log(`[test-seed] ride post-facturación:`);
  console.log(`  invoiceId:   ${ride.invoiceId || '(NO ASIGNADO)'}`);
  console.log(`  invoicedAt:  ${ride.invoicedAt || '(NO ASIGNADO)'}`);
  return ride.invoiceId || null;
}

/**
 * Anula la factura emitida en Datil. Solo se llama cuando estamos en
 * producción (DATIL_ENV=2) y el TEST_SEED produjo un invoiceId — así
 * la factura nunca contamina el SRI real.
 */
export async function cancelTestInvoice(invoiceId: string): Promise<void> {
  console.log(`[test-seed] anulando factura de prueba en Datil: ${invoiceId}`);
  try {
    await cancelInvoice(invoiceId);
    console.log(`[test-seed] ✅ factura ${invoiceId} anulada`);
  } catch (e) {
    console.error(`[test-seed] ❌ falló anular factura ${invoiceId}: ${(e as Error).message}`);
    console.error(`[test-seed] ⚠️  REVISAR MANUALMENTE en panel Datil — la factura puede haber sido autorizada por SRI`);
  }
}
