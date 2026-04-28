/**
 * Modo de prueba E2E: inserta un ride en MongoDB Atlas, espera a que el
 * loop de facturación lo procese, y limpia. Se activa con TEST_SEED=1.
 *
 * Solo se debe usar mientras DATIL_ENV=1 (sandbox) — emite una factura
 * REAL en Datil pero en su entorno de pruebas, así no contamina el SRI.
 *
 * Por defecto el seed crea un ride completed con pago en efectivo
 * confirmado, valor $25 USD, ruta de prueba, modalidad privado.
 */
import { ObjectId } from 'mongodb';
import { getRidesDb } from '../mongodb/connection';

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
      total:    25.00,
      subtotal: 21.74,    // 25 / 1.15
      iva:       3.26,    // 25 - 21.74
    },
    finalFare:     { total: 25.00 },
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

export async function showTestRideStatus(rideId: string): Promise<void> {
  const db = await getRidesDb();
  const _id = ObjectId.isValid(rideId) ? new ObjectId(rideId) : rideId;
  const ride = await db.collection('rides').findOne({ _id: _id as any });
  if (!ride) {
    console.log(`[test-seed] ride ${rideId} no encontrado tras facturar`);
    return;
  }
  console.log(`[test-seed] ride post-facturación:`);
  console.log(`  invoiceId:   ${ride.invoiceId || '(NO ASIGNADO)'}`);
  console.log(`  invoicedAt:  ${ride.invoicedAt || '(NO ASIGNADO)'}`);
}
