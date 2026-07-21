// Tarifas del motor de precios — SIN tabla local.
//
// Este archivo tenía 174 rutas incrustadas, generadas desde el Excel el 6 de
// julio, y las usaba como respaldo silencioso: si `/snapshot` fallaba,
// `getFare()` devolvía el precio congelado COMO SI FUERA BUENO. Como la
// sincronización estuvo rota semanas (el endpoint daba 404), la app pudo estar
// cotizando precios de julio sin que nadie lo notara.
//
// Ahora la tabla vive en UN solo lugar: el motor. Si el motor no responde, esta
// app NO cotiza y lo dice. Un "no puedo cotizar ahora" es recuperable; cobrar un
// precio viejo, no.
//
// Distinguir los dos casos importa: "esta ruta no tiene tarifa" y "el motor no
// contestó" se veían igual (ambos `null`) y son problemas distintos —uno se
// resuelve agregando la ruta, el otro reintentando—.

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.goingec.com';

export interface PrivatePrices {
  suv: number; suv_xl: number; van: number; van_xl: number;
  minibus: number; bus: number; bus_40: number;
}

/** Por qué no hay precio: falta la ruta, o el motor no está disponible. */
export type FareLookup<T> =
  | { estado: 'ok'; valor: T }
  | { estado: 'sin_tarifa' }
  | { estado: 'motor_no_disponible' };

function normalize(city: string): string {
  const s = city.split(',')[0].trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim();
  if (s.startsWith('aeropuerto')) return 'aeropuerto';
  // Zonas de Quito colapsan a 'quito' (misma tarifa; la diferencia de zona
  // ya no cobra recargo — precios fijos de mercado).
  if (/^(quito|cumbaya|tumbaco|los chillos|sangolqui|valle)/.test(s)) return 'quito';
  return s.replace(/\s+/g, '_');
}

function pair(a: string, b: string): string { return `${normalize(a)}-${normalize(b)}`; }

// ── Tabla viva, bajada del motor ──────────────────────────────────────────────
let motorShared: Record<string, number> | null = null;
let motorPrivate: Record<string, PrivatePrices> | null = null;
let ultimoIntento = 0;

/** True si la app tiene tarifas del motor cargadas y puede cotizar. */
export function motorDisponible(): boolean {
  return motorShared != null || motorPrivate != null;
}

export function setMotorFares(
  shared?: Record<string, number> | null,
  priv?: Record<string, PrivatePrices> | null,
): void {
  if (shared && Object.keys(shared).length) motorShared = shared;
  if (priv && Object.keys(priv).length) motorPrivate = priv;
}

/**
 * Baja el snapshot del motor. Devuelve si quedó disponible.
 *
 * Ya NO es fire-and-forget: quien cotiza necesita saber si hay tarifas. Si
 * falla, `motorDisponible()` queda en false y las consultas lo informan en vez
 * de inventar un precio.
 */
export async function loadMotorSnapshot(): Promise<boolean> {
  ultimoIntento = Date.now();
  try {
    const res = await fetch(`${API_BASE}/snapshot`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return false;
    const d = await res.json() as {
      compartido?: { shared?: Record<string, number> };
      privado?: { private?: Record<string, PrivatePrices> };
    };
    setMotorFares(d.compartido?.shared, d.privado?.private);
    return motorDisponible();
  } catch {
    return false;
  }
}

/** Momento del último intento de sincronización (0 si nunca se intentó). */
export function ultimaSincronizacion(): number {
  return ultimoIntento;
}

/** Precio compartido por persona. */
export function buscarTarifaCompartida(origin: string, destination: string): FareLookup<number> {
  if (!motorShared) return { estado: 'motor_no_disponible' };
  const v = motorShared[pair(origin, destination)] ?? motorShared[pair(destination, origin)];
  return v != null ? { estado: 'ok', valor: v } : { estado: 'sin_tarifa' };
}

/** Precios privados por vehículo. */
export function buscarTarifaPrivada(origin: string, destination: string): FareLookup<PrivatePrices> {
  if (!motorPrivate) return { estado: 'motor_no_disponible' };
  const v = motorPrivate[pair(origin, destination)] ?? motorPrivate[pair(destination, origin)];
  return v != null ? { estado: 'ok', valor: v } : { estado: 'sin_tarifa' };
}

// ── Compatibilidad con el código existente ───────────────────────────────────
// Devuelven `null` tanto si falta la ruta como si el motor no está. Quien
// necesite distinguirlo debe usar las funciones `buscarTarifa*`.

/** @deprecated Usa `buscarTarifaCompartida` para poder distinguir el motivo. */
export function getFare(origin: string, destination: string): number | null {
  const r = buscarTarifaCompartida(origin, destination);
  return r.estado === 'ok' ? r.valor : null;
}

/** @deprecated Usa `buscarTarifaPrivada` para poder distinguir el motivo. */
export function getPrivatePrices(origin: string, destination: string): PrivatePrices | null {
  const r = buscarTarifaPrivada(origin, destination);
  return r.estado === 'ok' ? r.valor : null;
}
