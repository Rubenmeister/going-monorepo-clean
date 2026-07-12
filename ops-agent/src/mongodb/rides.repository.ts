/**
 * Rides repository para ops-agent — lee la collection `rides` real
 * (going-bookings, escrita por transport-service).
 *
 * Schema MongoDB real (subset relevante para ops):
 *   _id, userId, driverId, status, requestedAt, completedAt, cancelledAt,
 *   pickupLocation { address, coordinates? }, dropoffLocation,
 *   fare { total, subtotal }, finalFare { total },
 *   paymentMethod, cashConfirmed, paymentRef
 *
 * El ops-agent solo necesita un subset enfocado a operaciones:
 *   - viajes pendientes que no tienen conductor asignado
 *   - viajes completados de un conductor en un día
 *   - última actividad de un conductor
 */
import { Filter } from 'mongodb';
import { getRidesDb, getUsersDb } from './connection';

export interface PendingRide {
  id:           string;
  status:       string;
  requestedAt:  Date;
  pickupAddr:   string;
  dropoffAddr:  string;
  fareEstimated: number;
  ageMinutes:   number;
}

export interface CompletedRide {
  id:          string;
  driverId:    string;
  fareTotal:   number;
  completedAt: Date;
}

interface MongoRide {
  _id:               any;
  driverId?:         string;
  status?:           string;
  pickupLocation?:   { address?: string };
  dropoffLocation?:  { address?: string };
  fare?:             { total?: number; estimatedTotal?: number };
  finalFare?:        { total?: number };
  requestedAt?:      Date;
  completedAt?:      Date;
}

/**
 * Viajes en estado solicitado/pending sin driverId asignado, o con
 * status='requested' que llevan más del cutoff sin acceptación.
 *
 * En el schema real de transport-service un viaje "sin conductor" es:
 *   status === 'requested' (o 'pending')  AND  driverId no existe / es null
 *
 * Cutoff = minutos desde requestedAt
 */
export async function mongoGetPendingRidesNoDriver(cutoffMinutes: number): Promise<PendingRide[]> {
  const db = await getRidesDb();
  const cutoff = new Date(Date.now() - cutoffMinutes * 60 * 1000);

  const filter: Filter<MongoRide> = {
    status: { $in: ['requested', 'pending', 'searching'] },
    $or: [
      { driverId: { $exists: false } },
      { driverId: null as any },
      { driverId: '' },
    ],
    requestedAt: { $lte: cutoff },
  };

  const docs = await db.collection<MongoRide>('rides').find(filter).limit(50).toArray();

  return docs.map(d => ({
    id:           String(d._id),
    status:       d.status || 'unknown',
    requestedAt:  d.requestedAt || new Date(),
    pickupAddr:   d.pickupLocation?.address  || 'origen desconocido',
    dropoffAddr:  d.dropoffLocation?.address || 'destino desconocido',
    fareEstimated: d.fare?.estimatedTotal || d.fare?.total || 0,
    ageMinutes:   d.requestedAt
      ? Math.round((Date.now() - d.requestedAt.getTime()) / 60000)
      : 0,
  }));
}

export interface NoShowSummary {
  noShowCount: number;      // rides que quedaron 'no_show' terminal en la ventana
  rematchingCount: number;  // rides re-asignados por no-show y aún buscando (rematchCount>0, status requested/searching)
  maxRematch: number;       // el rematchCount más alto visto (señal de un ride problemático)
  samples: { id: string; rematchCount: number; status: string }[];
}

/**
 * Resumen de no-shows y auto-rematches en una ventana reciente. Sirve al
 * ops-agent para observar el efecto del auto-rematch (transport-service) y
 * elevar al cerebro si hay un patrón (muchos no-shows = problema de oferta/
 * disciplina de conductores).
 */
export async function mongoGetRecentNoShows(cutoffMinutes: number): Promise<NoShowSummary> {
  const db = await getRidesDb();
  const cutoff = new Date(Date.now() - cutoffMinutes * 60 * 1000);
  const col = db.collection<MongoRide & { rematchCount?: number; cancellationTime?: Date }>('rides');

  const [noShowCount, rematchingDocs] = await Promise.all([
    col.countDocuments({ status: 'no_show', cancellationTime: { $gte: cutoff } } as any),
    col.find({
      rematchCount: { $gte: 1 } as any,
      status: { $in: ['requested', 'searching'] },
    }).limit(50).toArray(),
  ]);

  const maxRematch = rematchingDocs.reduce((m, d) => Math.max(m, (d as any).rematchCount || 0), 0);

  return {
    noShowCount,
    rematchingCount: rematchingDocs.length,
    maxRematch,
    samples: rematchingDocs.slice(0, 5).map((d) => ({
      id: String(d._id),
      rematchCount: (d as any).rematchCount || 0,
      status: d.status || 'unknown',
    })),
  };
}

/**
 * Rides completados hoy (Ecuador) por conductor — para revenue diario.
 */
export async function mongoGetCompletedRidesToday(): Promise<CompletedRide[]> {
  const db = await getRidesDb();

  // Inicio del día Ecuador en UTC
  const ecuadorNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
  const ecuadorMidnight = new Date(ecuadorNow);
  ecuadorMidnight.setHours(0, 0, 0, 0);
  // Convertir a UTC restando offset de Ecuador (-5h)
  const startUtc = new Date(ecuadorMidnight.getTime() + 5 * 3600 * 1000);

  const docs = await db.collection<MongoRide>('rides').find({
    status: 'completed',
    completedAt: { $gte: startUtc },
  }).toArray();

  return docs
    .filter(d => d.driverId)
    .map(d => ({
      id:          String(d._id),
      driverId:    d.driverId!,
      fareTotal:   d.finalFare?.total ?? d.fare?.total ?? 0,
      completedAt: d.completedAt || new Date(),
    }));
}

/**
 * Última actividad de un conductor: el `completedAt` más reciente de
 * sus rides. Usado para detectar inactividad (>2h sin completar viaje).
 */
export async function mongoGetDriverLastActivity(driverId: string): Promise<Date | null> {
  const db = await getRidesDb();
  const doc = await db.collection<MongoRide>('rides').findOne(
    { driverId, status: 'completed' },
    { sort: { completedAt: -1 }, projection: { completedAt: 1 } },
  );
  return doc?.completedAt || null;
}

/**
 * Stats globales del día para reporte 9pm.
 */
export async function mongoGetTodayRidesStats(): Promise<{
  completed: number;
  cancelled: number;
  totalRevenue: number;
}> {
  const db = await getRidesDb();
  const ecuadorNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
  const ecuadorMidnight = new Date(ecuadorNow);
  ecuadorMidnight.setHours(0, 0, 0, 0);
  const startUtc = new Date(ecuadorMidnight.getTime() + 5 * 3600 * 1000);

  const [completed, cancelled, revenueAgg] = await Promise.all([
    db.collection<MongoRide>('rides').countDocuments({
      status: 'completed',
      completedAt: { $gte: startUtc },
    }),
    db.collection<MongoRide>('rides').countDocuments({
      status: 'cancelled',
      cancelledAt: { $gte: startUtc },
    } as any),
    db.collection<MongoRide>('rides').aggregate([
      { $match: { status: 'completed', completedAt: { $gte: startUtc } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$finalFare.total', '$fare.total'] } } } },
    ]).toArray(),
  ]);

  return {
    completed,
    cancelled,
    totalRevenue: (revenueAgg[0] as any)?.total || 0,
  };
}

/**
 * Stats agregadas últimos 7 días — KPIs estratégicos para snapshot:
 *
 *   ridesCompleted7d         — count
 *   ridesCancelled7d         — count
 *   totalRevenue7d           — sum amount completed
 *   avgRideValueUsd          — totalRevenue7d / ridesCompleted7d
 *   uniqueActiveDrivers7d    — distinct driverId con rides completed en ventana
 *   rideCompletionRate       — completed / (completed + cancelled) [24h ventana,
 *                              corregido aquí para 7d más estable que día único]
 *
 * Ventana 7d desde "ahora". No alineamos a midnight Ecuador para que
 * sea siempre los últimos 168h corridos — más estable para análisis
 * de tendencia que "esta semana civil" que cambia bruscamente.
 */
export async function mongoGetWeeklyStats(): Promise<{
  ridesCompleted7d:        number;
  ridesCancelled7d:        number;
  totalRevenue7d:          number;
  avgRideValueUsd:         number;
  uniqueActiveDrivers7d:   number;
  rideCompletionRate:      number;
}> {
  const db = await getRidesDb();
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [completedCount, cancelledCount, revenueAgg, uniqueDriversAgg] = await Promise.all([
    db.collection<MongoRide>('rides').countDocuments({
      status: 'completed',
      completedAt: { $gte: since },
    }),
    db.collection<MongoRide>('rides').countDocuments({
      status: 'cancelled',
      cancelledAt: { $gte: since },
    } as any),
    db.collection<MongoRide>('rides').aggregate([
      { $match: { status: 'completed', completedAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$finalFare.total', '$fare.total'] } } } },
    ]).toArray(),
    db.collection<MongoRide>('rides').aggregate([
      { $match: { status: 'completed', completedAt: { $gte: since }, driverId: { $ne: null } } },
      { $group: { _id: '$driverId' } },
      { $count: 'uniqueCount' },
    ]).toArray(),
  ]);

  const totalRevenue7d        = (revenueAgg[0] as any)?.total || 0;
  const uniqueActiveDrivers7d = (uniqueDriversAgg[0] as any)?.uniqueCount || 0;
  const avgRideValueUsd       = completedCount > 0
    ? Number((totalRevenue7d / completedCount).toFixed(2))
    : 0;
  const totalAttempts = completedCount + cancelledCount;
  const rideCompletionRate = totalAttempts > 0
    ? Number((completedCount / totalAttempts).toFixed(4))
    : 0;

  return {
    ridesCompleted7d:        completedCount,
    ridesCancelled7d:        cancelledCount,
    totalRevenue7d:          Number(totalRevenue7d.toFixed(2)),
    avgRideValueUsd,
    uniqueActiveDrivers7d,
    rideCompletionRate,
  };
}

/**
 * Cuenta nuevos drivers signed-up en últimos 7 días.
 * Lee de la collection 'users' en going-users DB (no rides DB).
 */
export async function mongoGetNewDriverSignups7d(): Promise<number> {
  const usersDb = await getUsersDb();
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  return usersDb.collection('users').countDocuments({
    createdAt: { $gte: since },
    roles: 'driver',
  });
}
