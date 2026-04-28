/**
 * Users repository — lee de la collection `users` real (going-users DB)
 * escrita por user-auth-service.
 *
 * El financial-agent necesita datos del pasajero para emitir facturas en
 * Datil (nombre, email). El schema real NO tiene cédula/RUC, así que
 * caemos a "Consumidor Final" (cédula 9999999999999, tipo 07) cuando
 * falta — esto es válido para el SRI.
 */
import { getUsersDb } from './connection';

export interface PassengerData {
  name:           string;
  email:          string;
  identification: string;       // Cédula, RUC o pasaporte
  identificationType: '04' | '05' | '06' | '07'; // 04=RUC, 05=cédula, 06=pasaporte, 07=consumidor final
  phone?:         string;
}

interface MongoUser {
  _id?:       string;
  id?:        string;
  firstName?: string;
  lastName?:  string;
  email?:     string;
  phone?:     string;
  cedula?:    string;     // Si user-auth-service llega a agregarlo
  ruc?:       string;     // Si user-auth-service llega a agregarlo
}

const CONSUMIDOR_FINAL: PassengerData = {
  name:               'CONSUMIDOR FINAL',
  email:              'consumidor@final.com',
  identification:     '9999999999999',
  identificationType: '07',
};

/**
 * Lookup de nombre de conductor para reportes y payouts.
 * Igual que el pasajero, va a `going-users.users` por _id o id.
 * Si no se encuentra, devuelve un placeholder humano-legible.
 */
export async function mongoGetDriverName(driverId: string): Promise<string> {
  if (!driverId) return 'Conductor desconocido';
  try {
    const db = await getUsersDb();
    const doc = await db.collection<MongoUser>('users').findOne({
      $or: [{ _id: driverId }, { id: driverId }],
    });
    if (!doc) return `Conductor #${driverId.slice(-6)}`;
    const name = [doc.firstName, doc.lastName].filter(Boolean).join(' ').trim();
    return name || `Conductor #${driverId.slice(-6)}`;
  } catch {
    return `Conductor #${driverId.slice(-6)}`;
  }
}

export async function mongoGetPassenger(userId: string): Promise<PassengerData> {
  if (!userId) return CONSUMIDOR_FINAL;

  try {
    const db = await getUsersDb();
    // _id en user-auth-service es string (uuid v4), no ObjectId
    const doc = await db.collection<MongoUser>('users').findOne({
      $or: [{ _id: userId }, { id: userId }],
    });

    if (!doc) {
      console.log(`[users-repo] Passenger ${userId} not found, using Consumidor Final`);
      return CONSUMIDOR_FINAL;
    }

    const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(' ').trim() || 'CONSUMIDOR FINAL';

    // Prioridad: RUC > cédula > consumidor final
    if (doc.ruc) {
      return {
        name:               fullName,
        email:              doc.email || 'consumidor@final.com',
        identification:     doc.ruc,
        identificationType: '04',
        phone:              doc.phone,
      };
    }
    if (doc.cedula) {
      return {
        name:               fullName,
        email:              doc.email || 'consumidor@final.com',
        identification:     doc.cedula,
        identificationType: '05',
        phone:              doc.phone,
      };
    }

    // Sin identificación: consumidor final pero conservamos el nombre real
    return {
      name:               fullName,
      email:              doc.email || 'consumidor@final.com',
      identification:     '9999999999999',
      identificationType: '07',
      phone:              doc.phone,
    };
  } catch (e) {
    console.error(`[users-repo] Error fetching passenger ${userId}:`, (e as Error).message);
    return CONSUMIDOR_FINAL;
  }
}
