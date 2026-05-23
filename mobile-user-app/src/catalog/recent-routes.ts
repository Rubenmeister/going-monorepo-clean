/**
 * Persistencia de rutas recientes del usuario (AsyncStorage).
 *
 * Mantenemos MAX_RECENT entradas, FIFO con dedupe por destino. Se muestran
 * en el Home como atajos para repetir viajes frecuentes.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CityId, TripMode, VehicleId } from './types';

const RECENT_ROUTES_KEY = '@going:recent_routes_v1';
const MAX_RECENT = 4;

export interface RecentRoute {
  id:          string;
  origin:      string;
  destination: string;
  originCity:  CityId;
  vehicleType: VehicleId;
  tripMode:    TripMode;
  price:       number;
  ts:          number;     // timestamp
}

export async function loadRecentRoutes(): Promise<RecentRoute[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_ROUTES_KEY);
    return raw ? (JSON.parse(raw) as RecentRoute[]) : [];
  } catch { return []; }
}

export async function saveRecentRoute(
  route: Omit<RecentRoute, 'id' | 'ts'>,
): Promise<void> {
  try {
    const existing = await loadRecentRoutes();
    // Dedupe por destination exacto — si repito el mismo viaje no acumulo entradas.
    const deduped = existing.filter(r => r.destination !== route.destination);
    const updated: RecentRoute[] = [
      { ...route, id: `r_${Date.now()}`, ts: Date.now() },
      ...deduped,
    ].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(updated));
  } catch {
    // silent — recent routes are nice-to-have, no es crítico
  }
}

export async function clearRecentRoutes(): Promise<void> {
  try { await AsyncStorage.removeItem(RECENT_ROUTES_KEY); } catch {}
}
