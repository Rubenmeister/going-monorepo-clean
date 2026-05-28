/**
 * API pública de queries del KB.
 *
 * Funciones puras: leen del snapshot cacheado y devuelven resultados
 * estructurados. No tienen side effects, no llaman a la red.
 *
 * Para precios usa `findRoute()` — es la única función que devuelve
 * tarifas. Reemplaza la combinación FARES + pricing.service del antiguo
 * libs/pricing.
 */
import { getKnowledgeBase } from './loader';
import type {
  Modality,
  VehicleId,
  ClientTypeId,
  RouteEntry,
  FareResult,
  FareBreakdownItem,
  LugarInfo,
  ProductDoc,
  VehicleInfo,
  CoverageCity,
} from './types';

// ─── Rutas y tarifas ────────────────────────────────────────────────

export interface FindRouteOpts {
  origin: { canton: string; zone?: string };
  destination: { canton: string; zone?: string };
  modality: Modality;
  vehicle: VehicleId;
  /** Hora en zona Ecuador (UTC-5). Si no se pasa, usa Date.now(). */
  when?: Date;
  clientType?: ClientTypeId;
  /** El caller indica si la fecha es feriado en Ecuador. */
  isHoliday?: boolean;
}

/**
 * Busca una ruta y devuelve precio final + breakdown completo.
 *
 * @returns null si la ruta no existe en el catálogo.
 */
export function findRoute(opts: FindRouteOpts): FareResult | null {
  const kb = getKnowledgeBase();

  const route = matchRoute(kb.rutas, opts.origin, opts.destination);
  if (!route) return null;

  const vehicle = opts.vehicle;
  const modality = opts.modality;

  // ── 1) Precio base ──
  const baseTable = modality === 'shared' ? route.shared : route.private;
  const basePrice = baseTable?.[vehicle];
  if (basePrice == null) {
    // La ruta existe pero no tiene tarifa para ese vehículo+modalidad.
    return null;
  }

  const breakdown: FareBreakdownItem[] = [
    { type: 'base', label: `Base ${modality} ${vehicle}`, amount_usd: basePrice },
  ];

  let runningTotal = basePrice;

  // ── 2) Recargo de zona de origen ──
  const originZoneSurcharge = resolveZoneSurcharge(
    opts.origin.canton,
    opts.origin.zone,
  );
  if (originZoneSurcharge > 0) {
    breakdown.push({
      type: 'origin_zone_surcharge',
      label: `Recargo origen ${opts.origin.zone ?? opts.origin.canton}`,
      amount_usd: originZoneSurcharge,
    });
    runningTotal += originZoneSurcharge;
  }

  const when = opts.when ?? new Date();

  // ── 3) Hora del día ──
  const horaRule = matchHoraDelDia(kb.dynamicSurcharges.hora_del_dia, when);
  if (horaRule) {
    const mult = modality === 'private'
      ? horaRule.privado_multiplier
      : horaRule.compartido_multiplier;
    if (mult !== 1) {
      const delta = runningTotal * (mult - 1);
      breakdown.push({
        type: 'hora_del_dia',
        label: horaRule.label,
        amount_usd: delta,
        multiplier: mult,
      });
      runningTotal += delta;
    }
  }

  // ── 4) Día de la semana ──
  const diaRule = matchDiaSemana(kb.dynamicSurcharges.dia_de_la_semana, when);
  if (diaRule) {
    const mult = modality === 'private'
      ? diaRule.privado_multiplier
      : diaRule.compartido_multiplier;
    if (mult !== 1) {
      const delta = runningTotal * (mult - 1);
      breakdown.push({
        type: 'dia_de_la_semana',
        label: diaRule.label,
        amount_usd: delta,
        multiplier: mult,
      });
      runningTotal += delta;
    }
  }

  // ── 5) Feriado ──
  if (opts.isHoliday) {
    const fer = kb.dynamicSurcharges.feriado;
    const mult = modality === 'private'
      ? fer.privado_multiplier
      : fer.compartido_multiplier;
    if (mult !== 1) {
      const delta = runningTotal * (mult - 1);
      breakdown.push({
        type: 'feriado',
        label: 'Feriado nacional',
        amount_usd: delta,
        multiplier: mult,
      });
      runningTotal += delta;
    }
  }

  // ── 6) Tipo de cliente ──
  const clientType = opts.clientType ?? 'retail';
  const ct = kb.clientTypes.find((c) => c.id === clientType);
  if (ct && ct.multiplier !== 1) {
    const delta = runningTotal * (ct.multiplier - 1);
    breakdown.push({
      type: 'client_type',
      label: ct.label,
      amount_usd: delta,
      multiplier: ct.multiplier,
    });
    runningTotal += delta;
  }

  // ── Compose result ──
  const finalPrice = Math.round(runningTotal * 100) / 100;

  return {
    routeId: route.id,
    basePrice,
    finalPrice,
    breakdown,
    modality,
    vehicle,
    clientType,
    revisar: route.revisar || (ct?.revisar ?? false),
    trusted: !route.revisar && !(ct?.revisar ?? false),
  };
}

// ─── Helpers de matching ────────────────────────────────────────────

function matchRoute(
  rutas: RouteEntry[],
  origin: { canton: string; zone?: string },
  destination: { canton: string; zone?: string },
): RouteEntry | null {
  const originZone = origin.zone ?? 'centro_norte'; // default Quito
  return (
    rutas.find(
      (r) =>
        r.origin.canton === origin.canton &&
        (r.origin.zone ?? 'centro_norte') === originZone &&
        r.destination.canton === destination.canton &&
        (destination.zone == null || r.destination.zone === destination.zone),
    ) ?? null
  );
}

function resolveZoneSurcharge(
  canton: string,
  zoneId: string | undefined,
): number {
  if (!zoneId) return 0;
  const kb = getKnowledgeBase();
  const cityZones = kb.zones[canton];
  if (!cityZones) return 0;
  const zone = cityZones.zonas.find((z) => z.id === zoneId);
  return zone?.origin_surcharge_usd ?? 0;
}

function matchHoraDelDia(
  rules: { id: string; label: string; rango_horas?: string[]; privado_multiplier: number; compartido_multiplier: number }[],
  when: Date,
) {
  // Hora en zona Ecuador (UTC-5)
  const hourEc = (when.getUTCHours() - 5 + 24) % 24;
  for (const rule of rules) {
    if (!rule.rango_horas) continue;
    for (const range of rule.rango_horas) {
      const [from, to] = range.split('-').map((s) => parseInt(s.split(':')[0], 10));
      if (Number.isNaN(from) || Number.isNaN(to)) continue;
      if (from <= to) {
        if (hourEc >= from && hourEc < to) return rule;
      } else {
        // rango cruza medianoche (ej. 22-05)
        if (hourEc >= from || hourEc < to) return rule;
      }
    }
  }
  return null;
}

function matchDiaSemana(
  rules: { id: string; label: string; dias?: string[]; privado_multiplier: number; compartido_multiplier: number }[],
  when: Date,
) {
  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  // Día en zona Ecuador (UTC-5)
  const ecDay = new Date(when.getTime() - 5 * 60 * 60 * 1000).getUTCDay();
  const dayName = dayNames[ecDay];
  for (const rule of rules) {
    if (rule.dias?.includes(dayName)) return rule;
  }
  return null;
}

// ─── Lugares ────────────────────────────────────────────────────────

export function getCanton(id: string): LugarInfo | null {
  const kb = getKnowledgeBase();
  return kb.lugares.find((l) => l.id === id || l.canton === id) ?? null;
}

export function listLugares(): LugarInfo[] {
  return getKnowledgeBase().lugares;
}

// ─── Cobertura ──────────────────────────────────────────────────────

export function isCovered(cantonName: string): boolean {
  const kb = getKnowledgeBase();
  const norm = cantonName.toLowerCase().trim();
  return kb.coverage.active_cities.some(
    (c) => c.name.toLowerCase() === norm,
  );
}

export function listActiveCities(): CoverageCity[] {
  return getKnowledgeBase().coverage.active_cities;
}

export function listComingSoonCities(): string[] {
  return getKnowledgeBase().coverage.coming_soon;
}

// ─── Productos ──────────────────────────────────────────────────────

export function getProductInfo(id: string): ProductDoc | null {
  const kb = getKnowledgeBase();
  return kb.products.find((p) => p.id === id) ?? null;
}

export function listProducts(): ProductDoc[] {
  return getKnowledgeBase().products;
}

// ─── Flota ──────────────────────────────────────────────────────────

export function getVehicleInfo(id: VehicleId): VehicleInfo | null {
  return getKnowledgeBase().vehicles[id] ?? null;
}

// ─── Contact / Identity / About ────────────────────────────────────

export function getContactInfo() {
  return getKnowledgeBase().contact;
}

export function getIdentity() {
  return getKnowledgeBase().identity;
}

export function getAboutText(): string {
  return getKnowledgeBase().about;
}

// ─── Diagnostics ────────────────────────────────────────────────────

/**
 * Devuelve warnings producidos al cargar el KB. Útil para que el servicio
 * los loggee al startup y para health checks de monitoring.
 */
export function getKbWarnings(): string[] {
  return getKnowledgeBase().warnings;
}

/**
 * Devuelve cantidad de rutas con flag `revisar: true`. Métrica útil para
 * el ops dashboard ("¿cuántas tarifas falta validar?").
 */
export function countRutasPendientesRevision(): number {
  return getKnowledgeBase().rutas.filter((r) => r.revisar).length;
}
