/**
 * MongoDB Atlas connection para ops-agent.
 *
 * Conecta al cluster compartido `going-cluster.vy28mpj.mongodb.net`.
 * El URL viene del secret MONGO_URL (compartido con todos los servicios).
 */
import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;

const DB_NAMES = {
  rides: 'going-bookings',
  users: 'going-users',
} as const;

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client;
  const url = process.env.MONGO_URL;
  if (!url) {
    throw new Error('[mongodb] MONGO_URL no configurado — ops-agent requiere acceso a MongoDB Atlas');
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

export async function getRidesDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db(process.env.MONGO_DB_RIDES || DB_NAMES.rides);
}

export async function getUsersDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db(process.env.MONGO_DB_USERS || DB_NAMES.users);
}

export async function closeMongoClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
