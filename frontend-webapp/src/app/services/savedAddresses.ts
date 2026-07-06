'use client';
/**
 * Direcciones guardadas (Casa/Trabajo/favoritos como "Mamá") — FUENTE ÚNICA en
 * el backend (Atlas, `/auth/me/saved-addresses`), con caché en localStorage
 * para carga instantánea y offline. Reemplaza el localStorage-only anterior;
 * el móvil consume el MISMO endpoint → dejan de divergir entre clientes.
 *
 * La clave de caché `going_saved_addresses` se mantiene (la comparten el
 * LocationSelector, el account y envíos/cotizar) para no romper lo existente.
 */
import { authFetch, getStoredToken } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';
const CACHE_KEY = 'going_saved_addresses';

export type SavedAddressType = 'home' | 'work' | 'favorite';

export interface SavedAddress {
  id: string;
  type: SavedAddressType;
  label: string;        // "Casa", "Trabajo", o nombre personalizado ("Mamá")
  address: string;      // texto legible
  latitude: number;
  longitude: number;
}

function readCache(): SavedAddress[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeCache(list: SavedAddress[]): void {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    /* storage lleno/bloqueado: ignorar, el backend es la fuente */
  }
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Lee del backend si hay sesión; si no (o si falla), usa la caché local. */
export async function loadSavedAddresses(): Promise<SavedAddress[]> {
  if (!getStoredToken()) return readCache();
  try {
    const res = await authFetch(`${API_URL}/auth/me/saved-addresses`, { method: 'GET' });
    if (!res.ok) return readCache();
    const data = await res.json();
    const list: SavedAddress[] = Array.isArray(data?.savedAddresses) ? data.savedAddresses : [];
    writeCache(list);
    return list;
  } catch {
    return readCache();
  }
}

/**
 * Persiste la lista completa (backend + caché). Escritura optimista: guarda la
 * caché de inmediato y sincroniza con el backend; si el backend responde con la
 * lista saneada, esa gana. Offline → queda la versión local hasta el próximo login.
 */
export async function persistSavedAddresses(list: SavedAddress[]): Promise<SavedAddress[]> {
  writeCache(list);
  if (!getStoredToken()) return list;
  try {
    const res = await authFetch(`${API_URL}/auth/me/saved-addresses`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedAddresses: list }),
    });
    if (res.ok) {
      const data = await res.json();
      const saved: SavedAddress[] = Array.isArray(data?.savedAddresses) ? data.savedAddresses : list;
      writeCache(saved);
      return saved;
    }
  } catch {
    /* offline: la caché ya tiene la versión optimista */
  }
  return list;
}

/**
 * Agrega o actualiza una dirección. `home`/`work` son únicas (reemplazan a la
 * existente de su tipo); los favoritos se acumulan. Opera sobre la caché (que
 * `loadSavedAddresses` mantiene fresca) y sincroniza.
 */
export async function upsertSavedAddress(
  addr: Omit<SavedAddress, 'id'> & { id?: string },
): Promise<SavedAddress[]> {
  const id = addr.id || newId();
  const list = readCache();
  const rest =
    addr.type === 'favorite'
      ? list.filter((a) => a.id !== id)
      : list.filter((a) => a.type !== addr.type);
  return persistSavedAddresses([{ ...addr, id }, ...rest]);
}

/** Quita una dirección por id. */
export async function removeSavedAddress(id: string): Promise<SavedAddress[]> {
  return persistSavedAddresses(readCache().filter((a) => a.id !== id));
}

/** Icono por tipo para la UI. */
export function iconForType(type: SavedAddressType): string {
  return type === 'home' ? '🏠' : type === 'work' ? '💼' : '⭐';
}
