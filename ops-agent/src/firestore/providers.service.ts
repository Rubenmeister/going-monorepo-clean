import { Firestore } from '@google-cloud/firestore';
import type { Driver, TransportProvider, HostProvider, GuideProvider, OperatorProvider, Alert } from '../types/provider.types';

const db = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

// ─── DRIVERS ──────────────────────────────────────────────────

export async function getActiveDrivers(): Promise<Driver[]> {
  const snap = await db.collection('drivers')
    .where('status', 'in', ['available', 'busy'])
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Driver));
}

export async function getDriversByProvincia(provincia: string): Promise<Driver[]> {
  const snap = await db.collection('drivers')
    .where('location.provincia', '==', provincia)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Driver));
}

export async function getDriverById(driverId: string): Promise<Driver | null> {
  const doc = await db.collection('drivers').doc(driverId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Driver;
}

export async function getIdleDrivers(minIdleHours: number = 2): Promise<Driver[]> {
  const snap = await db.collection('drivers')
    .where('status', '==', 'available')
    .get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Driver))
    .filter(d => (d.serviceHours?.hoursIdle || 0) >= minIdleHours);
}

export async function getDriversBelowRevenueTarget(threshold: number): Promise<Driver[]> {
  const snap = await db.collection('drivers')
    .where('status', 'in', ['available', 'busy'])
    .get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Driver))
    .filter(d => (d.revenue?.today || 0) < threshold);
}

export async function getExpiringDocuments(daysAhead: number = 15): Promise<{
  licenses: Driver[];
  insurance: Driver[];
  soat: Driver[];
}> {
  const allDrivers = await db.collection('drivers').get();
  const drivers = allDrivers.docs.map(d => ({ id: d.id, ...d.data() } as Driver));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return {
    licenses:  drivers.filter(d => d.license?.expiry  <= cutoffStr),
    insurance: drivers.filter(d => d.insurance?.expiry <= cutoffStr),
    soat:      drivers.filter(d => d.vehicle?.soatExpiry <= cutoffStr),
  };
}

export async function getLowRatingDrivers(minRating: number = 4.0): Promise<Driver[]> {
  // Nota: se usa una sola condición en Firestore para evitar requerir índice compuesto.
  // El filtro de rating.count >= 5 se aplica en memoria.
  const snap = await db.collection('drivers')
    .where('rating.average', '<', minRating)
    .get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Driver))
    .filter(d => (d.rating?.count || 0) >= 5);
}

export async function getAcademyInactiveDrivers(days: number = 30): Promise<Driver[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const snap = await db.collection('drivers').get();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Driver))
    .filter(d => !d.academy?.lastActivityAt || d.academy.lastActivityAt < cutoffStr);
}

// ─── TRANSPORT PROVIDERS ──────────────────────────────────────

export async function getTransportProviders(): Promise<TransportProvider[]> {
  const snap = await db.collection('transport_providers').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TransportProvider));
}

export async function getTransportByProvincia(provincia: string): Promise<TransportProvider[]> {
  const snap = await db.collection('transport_providers')
    .where('location.provincia', '==', provincia)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TransportProvider));
}

// ─── HOSTS ────────────────────────────────────────────────────

export async function getHostProviders(): Promise<HostProvider[]> {
  const snap = await db.collection('host_providers').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as HostProvider));
}

// ─── GUIDES ───────────────────────────────────────────────────

export async function getGuideProviders(): Promise<GuideProvider[]> {
  const snap = await db.collection('guide_providers').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as GuideProvider));
}

// ─── OPERATORS ────────────────────────────────────────────────

export async function getOperatorProviders(): Promise<OperatorProvider[]> {
  const snap = await db.collection('operator_providers').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as OperatorProvider));
}

// ─── ALERTS HISTORY ───────────────────────────────────────────

export async function saveAlert(alert: Omit<Alert, 'id'>): Promise<string> {
  const ref = await db.collection('ops_alerts').add(alert);
  return ref.id;
}

export async function getRecentAlerts(limitCount: number = 50): Promise<Alert[]> {
  const snap = await db.collection('ops_alerts')
    .orderBy('sentAt', 'desc')
    .limit(limitCount)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Alert));
}

export async function getAlertsByProvider(providerId: string): Promise<Alert[]> {
  const snap = await db.collection('ops_alerts')
    .where('providerId', '==', providerId)
    .orderBy('sentAt', 'desc')
    .limit(20)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Alert));
}

// ─── REVENUE STATS ────────────────────────────────────────────

export async function getDailyRevenueStats(): Promise<{
  totalRevenue: number;
  driversAtTarget: number;
  driversBelow50: number;
  topDriver: { name: string; revenue: number } | null;
}> {
  const drivers = await getActiveDrivers();
  const totalRevenue = drivers.reduce((sum, d) => sum + (d.revenue?.today || 0), 0);
  const driversAtTarget = drivers.filter(d => (d.revenue?.today || 0) >= 100).length;
  const driversBelow50 = drivers.filter(d => (d.revenue?.today || 0) < 50).length;

  const top = drivers.sort((a, b) => (b.revenue?.today || 0) - (a.revenue?.today || 0))[0];

  return {
    totalRevenue,
    driversAtTarget,
    driversBelow50,
    topDriver: top ? {
      name: `${top.personal.nombre} ${top.personal.apellido}`,
      revenue: top.revenue?.today || 0,
    } : null,
  };
}
