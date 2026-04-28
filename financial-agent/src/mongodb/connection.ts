/**
 * MongoDB Atlas connection for financial-agent.
 *
 * Going usa cluster compartido `going-cluster.vy28mpj.mongodb.net` con DBs
 * separadas por servicio. financial-agent lee de:
 *   - going-bookings  → rides         (transport-service)
 *   - going-payments  → transactions  (payment-service)
 *   - going-users     → users         (user-auth-service)
 *
 * El URL principal viene del secret MONGO_URL (compartido con todos los
 * servicios). El nombre de la DB se selecciona por collection.
 */
import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;

const DB_NAMES = {
  rides:        'going-bookings',
  transactions: 'going-payments',
  users:        'going-users',
} as const;

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client;

  const url = process.env.MONGO_URL;
  if (!url) {
    throw new Error('[mongodb] MONGO_URL no configurado — financial-agent requiere acceso a MongoDB Atlas');
  }

  client = new MongoClient(url, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS:         30000,
    socketTimeoutMS:          45000,
  });
  await client.connect();
  console.log('[mongodb] connected');
  return client;
}

/** Db de rides (transport-service collection rides). */
export async function getRidesDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db(process.env.MONGO_DB_RIDES || DB_NAMES.rides);
}

export async function getTransactionsDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db(process.env.MONGO_DB_PAYMENTS || DB_NAMES.transactions);
}

export async function getUsersDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db(process.env.MONGO_DB_USERS || DB_NAMES.users);
}

/** Para llamar antes de exit(0) de modo limpio. */
export async function closeMongoClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
