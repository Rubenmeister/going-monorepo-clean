/**
 * Drivers repository — usuarios con role='driver' en going-users.users.
 *
 * Schema real (user-auth-service):
 *   _id, id, email, firstName, lastName, phone, roles[], status, createdAt
 *
 * El rich schema que esperaba el ops-agent original (vehicle.placa,
 * license.expiry, insurance, rating, serviceHours, revenue) NO existe.
 * Lo derivamos de los rides cuando es posible (revenue del día), o
 * dejamos el monitor deshabilitado (license/SOAT/rating).
 */
import { getUsersDb } from './connection';

export interface DriverBasic {
  id:         string;
  fullName:   string;
  email:      string;
  phone:      string;
  status:     string;          // 'active' | 'suspended' | 'pending_verification'
  createdAt:  Date | null;
}

interface MongoUser {
  _id?:       string;
  id?:        string;
  email?:     string;
  firstName?: string;
  lastName?:  string;
  phone?:     string;
  roles?:     string[];
  status?:    string;
  createdAt?: Date;
}

function toDriver(doc: MongoUser): DriverBasic {
  return {
    id:        doc.id || String(doc._id || ''),
    fullName:  [doc.firstName, doc.lastName].filter(Boolean).join(' ').trim() || '(sin nombre)',
    email:     doc.email  || '',
    phone:     doc.phone  || '',
    status:    doc.status || 'unknown',
    createdAt: doc.createdAt || null,
  };
}

/** Todos los usuarios con role='driver' en estado activo. */
export async function mongoGetAllDrivers(): Promise<DriverBasic[]> {
  const db = await getUsersDb();
  const docs = await db.collection<MongoUser>('users').find({
    roles: 'driver',
    status: 'active',
  }).toArray();
  return docs.map(toDriver);
}

/** Lookup de un conductor por id, devuelve null si no existe. */
export async function mongoGetDriverById(driverId: string): Promise<DriverBasic | null> {
  if (!driverId) return null;
  const db = await getUsersDb();
  const doc = await db.collection<MongoUser>('users').findOne({
    $or: [{ _id: driverId as any }, { id: driverId }],
  });
  return doc ? toDriver(doc) : null;
}

/** Lookup eficiente de varios conductores a la vez (para reportes). */
export async function mongoGetDriversByIds(ids: string[]): Promise<Map<string, DriverBasic>> {
  if (ids.length === 0) return new Map();
  const db = await getUsersDb();
  const docs = await db.collection<MongoUser>('users').find({
    $or: [
      { _id: { $in: ids as any[] } },
      { id:  { $in: ids } },
    ],
  }).toArray();
  const map = new Map<string, DriverBasic>();
  for (const doc of docs) {
    const driver = toDriver(doc);
    map.set(driver.id, driver);
  }
  return map;
}
