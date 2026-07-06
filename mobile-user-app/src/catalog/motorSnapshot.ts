/**
 * Snapshot del MOTOR DE TARIFAS (runtime) para el móvil.
 *
 * Igual que el webapp: la app baja `/snapshot` al arrancar y sobrescribe las
 * tablas locales (`fares.ts`, `excel-fares.ts`) con los datos AUTORITATIVOS del
 * motor (Atlas). Así la cotización del móvil muestra los MISMOS precios que el
 * backend — cierra la divergencia del mirror local. Si el fetch falla, se usa
 * el mirror bundleado (offline/robusto).
 *
 * OJO: el móvil necesita un build EAS nuevo para que este código llegue a los
 * usuarios; el snapshot en runtime evita tener que re-buildear por cada cambio
 * de tarifa (esos ya se toman del motor al vuelo).
 */
let motorSharedTbl: Record<string, number> | null = null;
let motorPrivateTbl: Record<string, Record<string, number>> | null = null;

/** Precio compartido del motor (ambas direcciones), o null si no está cargado. */
export function motorShared(k1: string, k2: string): number | null {
  if (!motorSharedTbl) return null;
  return motorSharedTbl[k1] ?? motorSharedTbl[k2] ?? null;
}

/** Precios privados por vehículo del motor, o null. */
export function motorPrivate(k1: string, k2: string): Record<string, number> | null {
  if (!motorPrivateTbl) return null;
  return motorPrivateTbl[k1] ?? motorPrivateTbl[k2] ?? null;
}

/** Baja el snapshot del motor y sobrescribe las tablas. Fire-and-forget al arrancar. */
export async function loadMotorSnapshot(): Promise<boolean> {
  try {
    const API = process.env.EXPO_PUBLIC_API_URL || 'https://api.goingec.com';
    const res = await fetch(`${API.replace(/\/$/, '')}/snapshot`);
    if (!res.ok) return false;
    const d = (await res.json()) as {
      compartido?: { shared?: Record<string, number> };
      privado?: { private?: Record<string, Record<string, number>> };
    };
    const s = d?.compartido?.shared;
    const p = d?.privado?.private;
    if (s && Object.keys(s).length) motorSharedTbl = s;
    if (p && Object.keys(p).length) motorPrivateTbl = p;
    return true;
  } catch {
    return false;
  }
}
