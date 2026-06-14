/**
 * Fare calculation — precios fijos por par de ciudades (puerta a puerta)
 *
 * Modelo de precios:
 *  · Los valores de CITY_PAIR_PRICES son precio COMPARTIDO (3 pasajeros, SUV).
 *  · Privado Confort  = round(compartido × 4 / 10) × 10
 *  · Privado Premium  = Privado Confort + $10
 *
 * Recargos dinámicos (aumento sobre precio base):
 *  · Hora pico mañana  06:00–09:00  → privado +15%  · compartido +8%
 *  · Hora pico tarde   17:00–20:00  → privado +15%  · compartido +8%
 *  · Noche             22:00–05:00  → privado +20%  · compartido +10%
 *  · Fin de semana     sáb/dom      → privado +10%  · compartido +5%
 *  · Feriado nacional  (lista EC)   → privado +25%  · compartido +12%
 *  Los recargos de tiempo y de día se SUMAN (ej. feriado nocturno = +25% +20%)
 *
 * Recargo por segmento de cliente (aumento sobre precio base):
 *  · Agencias    → +25%  (incluye comisión que Going App paga al intermediario)
 *  · Empresas    → +25%  (servicio premium: mejor vehículo, conductor top, espera sin extras, pago diferido)
 *  · Público     → sin recargo adicional
 *
 * Descuentos (reducción sobre precio final):
 *  · Solo por acumulación de puntos (pequeños negocios y público general)
 *  · Gestionados por separado en loyalty-service; discountRate = 0 por defecto
 *
 * Recargo de origen (+$5, fijo — no se ve afectado por recargos ni descuentos):
 *  Se suma cuando el punto de RECOGIDA es:
 *    Quito Sur · Valles (Cumbayá/Tumbaco · Los Chillos) · Aeropuerto Tababela
 *
 * Rutas con precio completo predefinido (no siguen la fórmula ×4):
 *  · Quito Centro Norte ↔ Aeropuerto Tababela
 *      compartido $10 · privado $25 · premium $30
 *    (el recargo de origen se aplica adicionalmente si corresponde)
 *
 * Quito se divide en 3 zonas:
 *   "quito centro norte"  (Iñaquito, La Carolina, González Suárez, norte)
 *   "quito sur"           (Quitumbe, Chillogallo, Guamaní)
 *   "cumbaya  tumbaco valle" / "los chillos  sangolqui" (valles orientales)
 *   "aeropuerto quito tababela"
 */

import type { Location, VehicleType } from '@/types';
import { VEHICLE_TYPES } from '@/types';

// ════════════════════════════════════════════════════════════════
// TIPOS PÚBLICOS
// ════════════════════════════════════════════════════════════════

/** Segmento de cliente que afecta el descuento aplicado */
export type ClientSegment = 'public' | 'agency' | 'corporate';

/**
 * Contexto de precio para recargos dinámicos.
 * Todos los campos son opcionales; se usan valores por defecto si se omiten.
 */
export interface PricingContext {
  /** Fecha y hora del servicio (default: ahora) */
  dateTime?: Date;
  /** Segmento del cliente (default: 'public') */
  clientSegment?: ClientSegment;
}

export interface FareBreakdown {
  /** Precio compartido (base de tabla o fórmula) — SUV, sin recargos */
  sharedBase:        number;
  /** Tarifa final mostrada al pasajero (base + recargos - descuento + recargo origen) */
  totalFare:         number;
  distanceKm:        number;
  durationMin:       number;
  /** true = precio de tabla fija · false = estimado por distancia */
  isPriceFixed:      boolean;
  mode:              'ciudad' | 'privado' | 'compartido';
  tier:              'confort' | 'premium';
  /** Recargo fijo por zona de origen (+$5) */
  originSurcharge:   number;
  /** Tasa de recargo dinámica aplicada (0–1), ej. 0.15 = +15% */
  surchargeRate:     number;
  /** Descripción del recargo, ej. "Hora pico" · "Noche" · "Feriado" · null si no hay */
  surchargeLabel:    string | null;
  /** Recargo por segmento de cliente (0–1), ej. 0.25 = +25% para agencias/empresas */
  clientSurchargeRate:  number;
  /** Descripción del recargo de segmento, ej. "Servicio agencia" · null si público */
  clientSurchargeLabel: string | null;
  /** Descuento por puntos (0–1) — 0 por defecto; loyalty-service lo calcula */
  discountRate:         number;
  /** Segmento de cliente aplicado */
  clientSegment:     ClientSegment;
}

// ════════════════════════════════════════════════════════════════
// DISTANCIA Y DURACIÓN
// ════════════════════════════════════════════════════════════════

// ── Haversine (línea recta) — solo se usa como último respaldo ────
export function calculateDistance(pickup: Location, dropoff: Location): number {
  const R = 6371;
  const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
  const dLon = ((dropoff.lon - pickup.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 *
      Math.cos((pickup.lat * Math.PI) / 180) *
      Math.cos((dropoff.lat * Math.PI) / 180);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const AVERAGE_SPEED_KMH = 75;

// ════════════════════════════════════════════════════════════════
// TARIFA URBANA — modo "En la ciudad" (taxímetro dinámico)
// ════════════════════════════════════════════════════════════════
// A diferencia de los viajes interurbanos (privado/compartido), que tienen
// precios FIJOS por par de ciudades (tabla CITY_PAIR_PRICES), los viajes
// dentro de la ciudad se cobran con un modelo de taxímetro:
//   precio = base + (km × valor_km) + (min × valor_min)   [+ surge dinámico]
//
// ⚠️ VALORES PLACEHOLDER — ajustar a la tarifa real de Going App.
//    Pensados como referencia para Quito/Guayaquil; revísalos antes de
//    producción.
const URBAN_BASE_FARE     = 1.50;  // banderazo / arranque (USD)
const URBAN_PER_KM        = 0.45;  // USD por km recorrido
const URBAN_PER_MIN       = 0.12;  // USD por minuto de viaje
const URBAN_MIN_FARE      = 2.00;  // tarifa mínima garantizada (USD)
const URBAN_PREMIUM_MULT  = 1.30;  // recargo tier Premium en ciudad
const URBAN_SPEED_KMH     = 25;    // velocidad urbana para estimar minutos
                                   // cuando aún no hay duración real de ruta

/**
 * Taxímetro urbano: base + distancia + tiempo, con piso de tarifa mínima.
 * No incluye recargos dinámicos (surge) — esos se aplican aparte en
 * getFareBreakdown para poder mostrarlos desglosados.
 */
function urbanTaximeterBase(km: number, durationMin: number): number {
  const raw = URBAN_BASE_FARE + km * URBAN_PER_KM + durationMin * URBAN_PER_MIN;
  return Math.max(URBAN_MIN_FARE, raw);
}


export function calculateEstimatedDuration(pickup: Location, dropoff: Location): number {
  return Math.round((calculateDistance(pickup, dropoff) / AVERAGE_SPEED_KMH) * 60);
}

// ── Distancia real por carretera — Mapbox Directions API ──────────
export async function getRoadDistance(
  pickup:  Location,
  dropoff: Location,
  token:   string,
): Promise<{ distanceKm: number; durationMin: number }> {
  if (!token || pickup.lat === 0 || dropoff.lat === 0) {
    const km = calculateDistance(pickup, dropoff);
    return { distanceKm: km, durationMin: Math.round((km / AVERAGE_SPEED_KMH) * 60) };
  }
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${pickup.lon},${pickup.lat};${dropoff.lon},${dropoff.lat}` +
      `?overview=false&access_token=${token}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('mapbox_error');
    const json = await res.json() as { routes?: { distance: number; duration: number }[] };
    const route = json.routes?.[0];
    if (!route) throw new Error('no_route');
    return {
      distanceKm:  Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
    };
  } catch {
    const km = calculateDistance(pickup, dropoff);
    return { distanceKm: km, durationMin: Math.round((km / AVERAGE_SPEED_KMH) * 60) };
  }
}

// ════════════════════════════════════════════════════════════════
// FERIADOS NACIONALES — ECUADOR
// ════════════════════════════════════════════════════════════════

/**
 * Algoritmo de Meeus/Jones/Butcher para calcular Pascua (Domingo de Resurrección).
 * Retorna { month (1-based), day } para el año dado.
 */
function easterDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Genera el conjunto de feriados para un año dado.
 * Formato: "MM-DD" (clave de acceso rápido).
 */
function buildHolidaySet(year: number): Set<string> {
  const fmt = (m: number, d: number) =>
    `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // Feriados fijos
  const fixed = [
    fmt(1,  1),  // Año Nuevo
    fmt(5,  1),  // Día del Trabajo
    fmt(5,  24), // Batalla de Pichincha
    fmt(8,  10), // Primer Grito de Independencia
    fmt(10, 9),  // Independencia de Guayaquil
    fmt(11, 1),  // Día de los Difuntos
    fmt(11, 3),  // Independencia de Cuenca
    fmt(12, 25), // Navidad
  ];

  // Feriados variables (basados en Pascua)
  const { month, day } = easterDate(year);
  const easter      = new Date(year, month - 1, day);
  const carnivalMon = addDays(easter, -48);
  const carnivalTue = addDays(easter, -47);
  const goodFriday  = addDays(easter, -2);

  const variable = [carnivalMon, carnivalTue, goodFriday].map(
    (d) => fmt(d.getMonth() + 1, d.getDate()),
  );

  return new Set([...fixed, ...variable]);
}

// Cache de años ya calculados
const _holidayCache: Record<number, Set<string>> = {};

function getHolidaySet(year: number): Set<string> {
  if (!_holidayCache[year]) _holidayCache[year] = buildHolidaySet(year);
  return _holidayCache[year];
}

/** Comprueba si una fecha es feriado nacional en Ecuador */
export function isEcuadorHoliday(date: Date): boolean {
  const year  = date.getFullYear();
  const key   = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return getHolidaySet(year).has(key);
}

// ════════════════════════════════════════════════════════════════
// RECARGOS DINÁMICOS
// ════════════════════════════════════════════════════════════════

interface SurchargeResult {
  rate:  number;
  label: string | null;
}

/**
 * Calcula el recargo dinámico total para una fecha/hora y modo de servicio.
 *
 * Reglas:
 *  · Recargo de tiempo (hora pico / noche) y recargo de día (fin de semana / feriado)
 *    se SUMAN si coinciden (ej. feriado de noche = +25% + +20% = +45% en privado).
 *  · Dentro del recargo de día, se aplica el MAYOR (feriado > fin de semana).
 */
function getDynamicSurcharge(
  date: Date,
  mode: 'ciudad' | 'privado' | 'compartido',
): SurchargeResult {
  const hour    = date.getHours();
  const isShared = mode === 'compartido';

  // ── Recargo de tiempo ──────────────────────────────────────────
  let timeRate  = 0;
  let timeLabel: string | null = null;

  const isPeakMorning  = hour >= 6  && hour < 9;
  const isPeakEvening  = hour >= 17 && hour < 20;
  const isNight        = hour >= 22 || hour < 5;

  if (isNight) {
    timeRate  = isShared ? 0.10 : 0.20;
    timeLabel = 'Noche';
  } else if (isPeakMorning || isPeakEvening) {
    timeRate  = isShared ? 0.08 : 0.15;
    timeLabel = 'Hora pico';
  }

  // ── Recargo de día ─────────────────────────────────────────────
  let dayRate  = 0;
  let dayLabel: string | null = null;

  const dow = date.getDay(); // 0=domingo 6=sábado
  const isWeekend = dow === 0 || dow === 6;
  const isHoliday = isEcuadorHoliday(date);

  if (isHoliday) {
    dayRate  = isShared ? 0.12 : 0.25;
    dayLabel = 'Feriado';
  } else if (isWeekend) {
    dayRate  = isShared ? 0.05 : 0.10;
    dayLabel = 'Fin de semana';
  }

  const totalRate = timeRate + dayRate;

  // Etiqueta combinada cuando hay dos factores activos
  let label: string | null = null;
  if (timeLabel && dayLabel) label = `${dayLabel} · ${timeLabel}`;
  else if (timeLabel)        label = timeLabel;
  else if (dayLabel)         label = dayLabel;

  return { rate: totalRate, label };
}

// ════════════════════════════════════════════════════════════════
// RECARGO POR SEGMENTO DE CLIENTE
// ════════════════════════════════════════════════════════════════

interface ClientSurchargeResult {
  rate:  number;
  label: string | null;
}

/**
 * Recargo por segmento:
 *  · Agencias  +25% — tarifa incluye la comisión que Going App abona al intermediario
 *  · Empresas  +25% — servicio premium (vehículo top, conductor mejor calificado,
 *                       tiempo de espera sin cobro extra, facturación diferida)
 *  · Público   0%   — precio estándar
 *
 * Los descuentos por puntos se aplican después y son independientes de este recargo.
 */
function getClientSurcharge(segment: ClientSegment): ClientSurchargeResult {
  switch (segment) {
    case 'agency':    return { rate: 0.25, label: 'Servicio agencia' };
    case 'corporate': return { rate: 0.25, label: 'Servicio empresas' };
    default:          return { rate: 0,    label: null };
  }
}

// ════════════════════════════════════════════════════════════════
// NORMALIZACIÓN Y TABLAS DE PRECIOS
// ════════════════════════════════════════════════════════════════

function normalizeCity(address: string): string {
  return address
    .split(',')[0]
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim();
}

function pairKey(a: string, b: string): string {
  const na = normalizeCity(a);
  const nb = normalizeCity(b);
  return na <= nb ? `${na}|${nb}` : `${nb}|${na}`;
}

// ── Recargo de origen (+$5, fijo) ─────────────────────────────
const SURCHARGE_ORIGIN_CITIES = new Set([
  'quito sur',
  'cumbaya  tumbaco valle',
  'los chillos  sangolqui',
  'aeropuerto quito tababela',
]);

function getOriginSurcharge(pickup: Location): number {
  if (!pickup.address) return 0;
  return SURCHARGE_ORIGIN_CITIES.has(normalizeCity(pickup.address)) ? 5 : 0;
}

// ── Rutas con precio COMPLETO predefinido ─────────────────────
interface FullPriceEntry { compartido: number; privado: number; premium: number; }
const FULL_PRICE_ROUTES: Record<string, FullPriceEntry> = {
  'aeropuerto quito tababela|quito centro norte': { compartido: 10, privado: 25, premium: 30 },
};

// ── Tabla de precios COMPARTIDO — SUV, un sentido, USD ────────
const CITY_PAIR_PRICES: Record<string, number> = {

  // ── Rutas hacia Quito Centro Norte ───────────────────────────
  'cayambe|quito centro norte':              8,
  'guayllabamba|quito centro norte':         6,
  'ibarra|quito centro norte':               15,
  'atuntaqui|quito centro norte':            14,
  'otavalo|quito centro norte':              12,
  'peguche|quito centro norte':              15,
  'cotacachi|quito centro norte':            15,
  'tabacundo|quito centro norte':            7,
  'el quinche|quito centro norte':           7,
  'pifo|quito centro norte':                 6,
  'quito centro norte|tulcan':               24,
  'latacunga|quito centro norte':            10,
  'tambillo|quito centro norte':             8,
  'aloasi|quito centro norte':               10,
  'machachi|quito centro norte':             9,
  'ambato|quito centro norte':               15,
  'banos|quito centro norte':                17,
  'quito centro norte|riobamba':             17,
  'quito centro norte|guaranda':             24,
  'quito centro norte|santo domingo':        15,
  'esmeraldas|quito centro norte':           29,
  'quito centro norte|alausi':               29,
  'quito centro norte|puyo':                 34,
  'lago agrio|quito centro norte':           39,
  'quito centro norte|tena':                 29,
  'quito centro norte|cuenca':               44,
  'manta|quito centro norte':                49,
  'portoviejo|quito centro norte':           49,
  'quito centro norte|guayaquil':            49,
  'quito centro norte|salinas':              59,
  'montanita|quito centro norte':            54,
  'macas|quito centro norte':                54,
  'machala|quito centro norte':              64,
  'quito centro norte|zaruma':               64,
  'loja|quito centro norte':                 69,

  // ── Ruta Norte: Ibarra / Atuntaqui / Otavalo / Peguche ────────
  'atuntaqui|cumbaya  tumbaco valle':        19,
  'atuntaqui|los chillos  sangolqui':        20,
  'atuntaqui|quito sur':                     14,
  'aeropuerto quito tababela|peguche':       14,

  // ── Ruta Ambato: ciudades intermedias ──────────────────────────
  'latacunga|salcedo':                       3,
  'ambato|salcedo':                          5,
  'ambato|pillaro':                          5,
  'ambato|cevallos':                         4,
  'ambato|tisaleo':                          4,
  'ambato|mocha':                            4,
  'banos|mocha':                             4,
  'banos|cevallos':                          5,
  'banos|tisaleo':                           5,
  'banos|pillaro':                           6,
  'latacunga|pillaro':                       8,
  'latacunga|cevallos':                      9,
  'quito centro norte|salcedo':              12,
  'quito centro norte|pillaro':              11,
  'quito centro norte|cevallos':             12,
  'quito centro norte|tisaleo':              12,
  'quito centro norte|mocha':               13,

  // ── Ruta Santo Domingo: ciudades intermedias ──────────────────
  'el carmen|la concordia':                  7,
  'la concordia|santo domingo':              8,
  'la concordia|quito centro norte':         20,
  'aeropuerto quito tababela|la concordia':  35,

  // ── El Carmen → Quito / Aeropuerto (Ruta 2) ───────────────────
  'el carmen|quito centro norte':            20,
  'el carmen|santo domingo':                 8,
  'el carmen|quito sur':                     18,

  // ── Rutas hacia Quito Sur ────────────────────────────────────
  'quito sur|latacunga':                     10,
  'ambato|quito sur':                        13,
  'machachi|quito sur':                      7,
  'tambillo|quito sur':                      6,
  'aloasi|quito sur':                        8,
  'quito sur|riobamba':                      18,
  'banos|quito sur':                         15,
  'quito sur|cuenca':                        42,
  'quito sur|guayaquil':                     47,

  // ── Rutas hacia Valles (Cumbayá / Tumbaco) ──────────────────
  'cumbaya  tumbaco valle|latacunga':        15,
  'ambato|cumbaya  tumbaco valle':           17,
  'banos|cumbaya  tumbaco valle':            14,
  'cumbaya  tumbaco valle|pifo':             5,
  'cumbaya  tumbaco valle|riobamba':         22,
  'cumbaya  tumbaco valle|guayaquil':        53,
  'cumbaya  tumbaco valle|cuenca':           47,
  'cumbaya  tumbaco valle|tena':             27,

  // Rutas hacia Los Chillos / Sangolqui
  'latacunga|los chillos  sangolqui':        14,
  'ambato|los chillos  sangolqui':           16,
  'banos|los chillos  sangolqui':            13,
  'los chillos  sangolqui|riobamba':         21,
  'cuenca|los chillos  sangolqui':           46,

  // Aeropuerto Quito (Tababela)
  'aeropuerto quito tababela|latacunga':     15,
  'aeropuerto quito tababela|ambato':        18,
  'aeropuerto quito tababela|banos':         18,
  'aeropuerto quito tababela|riobamba':      25,
  'aeropuerto quito tababela|guayllabamba':  5,
  'aeropuerto quito tababela|cayambe':       9,
  'aeropuerto quito tababela|ibarra':        20,
  'aeropuerto quito tababela|atuntaqui':     14,
  'aeropuerto quito tababela|otavalo':       18,
  'aeropuerto quito tababela|pifo':          5,
  'aeropuerto quito tababela|el quinche':    6,
  'aeropuerto quito tababela|cuenca':        47,
  'aeropuerto quito tababela|guayaquil':     52,
  'aeropuerto quito tababela|santo domingo': 23,
  'aeropuerto quito tababela|el carmen':     35,
  'aeropuerto quito tababela|quito sur':     12,
  'aeropuerto quito tababela|cumbaya  tumbaco valle': 8,
  'aeropuerto quito tababela|los chillos  sangolqui': 15,

  // Desde / hacia Guayaquil
  'guayaquil|naranjal':      10,
  'guayaquil|salinas':       14,
  'guayaquil|montanita':     17,
  'guayaquil|machala':       19,
  'alausi|guayaquil':        24,
  'cuenca|guayaquil':        24,
  'guayaquil|riobamba':      29,
  'guayaquil|manta':         29,
  'guayaquil|portoviejo':    29,
  'guayaquil|santo domingo': 29,
  'guayaquil|zaruma':        29,
  'ambato|guayaquil':        34,
  'banos|guayaquil':         34,
  'guayaquil|latacunga':     39,
  'guayaquil|loja':          39,
  'esmeraldas|guayaquil':    54,
  'guayaquil|ibarra':        54,

  // Desde / hacia Cuenca
  'azogues|cuenca':          5,
  'alausi|cuenca':           17,
  'cuenca|machala':          19,
  'cuenca|loja':             24,
  'cuenca|riobamba':         24,
  'ambato|cuenca':           29,
  'cuenca|zaruma':           29,
  'cuenca|latacunga':        34,
  'cuenca|macas':            34,

  // Sierra interna
  'ibarra|otavalo':          5,
  'ambato|banos':            5,
  'latacunga|ambato':        5,
  'cotacachi|ibarra':        7,
  'ambato|riobamba':         7,
  'latacunga|riobamba':      11,
  'alausi|riobamba':         11,
  'ibarra|tulcan':           14,
  'ambato|puyo':             14,
  'cayambe|ibarra':          14,
  'ambato|tena':             17,
  'ibarra|latacunga':        19,

  // Costa interna
  'manta|portoviejo':        4,
  'montanita|salinas':       9,
  'esmeraldas|manta':        44,
  'manta|salinas':           49,

  // Sur del pais
  'loja|zaruma':             17,
  'machala|zaruma':          19,
  'loja|machala':            29,

  // Amazonia
  'puyo|tena':               11,
  'lago agrio|tena':         34,
  'macas|puyo':              34,
  'macas|tena':              44,
};

// Formula de respaldo
function distanceBasedSharedPrice(km: number): number {
  if (km <= 15) return 4;
  if (km <= 40) return Math.round(3 + km * 0.20);
  return Math.max(7, Math.round(4.5 + km * 0.082));
}

// Lookup base
function sharedSuvBase(
  pickup:  Location,
  dropoff: Location,
): { price: number; fixed: boolean; fullEntry?: FullPriceEntry } {
  if (pickup.address && dropoff.address) {
    const fullKey  = pairKey(pickup.address, dropoff.address);
    const fullEntry = FULL_PRICE_ROUTES[fullKey];
    if (fullEntry !== undefined) return { price: fullEntry.compartido, fixed: true, fullEntry };
    const p = CITY_PAIR_PRICES[fullKey];
    if (p !== undefined) return { price: p, fixed: true };
  }
  return {
    price: distanceBasedSharedPrice(calculateDistance(pickup, dropoff)),
    fixed: false,
  };
}

// ================================================================
// API PUBLICA
// ================================================================

/**
 * Calcula la tarifa final con todos los factores:
 *  1. Precio base (tabla o formula por distancia)
 *  2. Recargo dinamico por hora/dia/feriado (aumenta el precio base)
 *  3. Descuento por segmento de cliente (reduce el precio ya recargado)
 *  4. Recargo fijo de origen +$5 (se suma al final, no se descuenta)
 *
 * Formula:
 *   totalFare = round(basePrice x (1 + surchargeRate) x (1 - discountRate)) + originSurcharge
 */
export function getFareBreakdown(
  pickup:        Location,
  dropoff:       Location,
  vehicleType:   VehicleType = 'suv',
  tier:          'confort' | 'premium' = 'confort',
  mode:          'ciudad' | 'privado' | 'compartido' = 'privado',
  roadDistance?: { distanceKm: number; durationMin: number },
  context?:      PricingContext,
): FareBreakdown {
  const dist     = roadDistance?.distanceKm ?? calculateDistance(pickup, dropoff);
  const dateTime = context?.dateTime ?? new Date();
  const segment  = context?.clientSegment ?? 'public';

  // Duracion estimada: usa la real de la ruta si existe; si no, estima con la
  // velocidad apropiada (urbana es mucho mas lenta que interurbana).
  const durationMin = roadDistance?.durationMin ??
    Math.round((dist / (mode === 'ciudad' ? URBAN_SPEED_KMH : AVERAGE_SPEED_KMH)) * 60);

  // Modo "En la ciudad": taximetro dinamico.
  // No usa la tabla interurbana. Precio = base + km + min, con surge por
  // hora pico/noche/feriado. Siempre "estimado" (depende de la ruta real).
  if (mode === 'ciudad') {
    const vehicleC  = VEHICLE_TYPES[vehicleType] ?? VEHICLE_TYPES.suv;
    const isLarge   = !['suv', 'suv_xl', 'other'].includes(vehicleType);
    const vehFactor = isLarge ? vehicleC.multiplierConfort : 1;

    const urbanBase = urbanTaximeterBase(dist, durationMin) * vehFactor *
      (tier === 'premium' ? URBAN_PREMIUM_MULT : 1);

    // El surge dinamico SOLO aplica a viajes urbanos.
    const { rate: surge, label: surgeLabel } = getDynamicSurcharge(dateTime, mode);
    const { rate: clientRate, label: clientLabel } = getClientSurcharge(segment);
    const urbanTotal = Math.round(urbanBase * (1 + surge + clientRate) * 100) / 100;

    return {
      sharedBase:           Math.round(urbanBase * 100) / 100,
      totalFare:            urbanTotal,
      distanceKm:           roadDistance?.distanceKm ?? Math.round(dist * 10) / 10,
      durationMin,
      isPriceFixed:         false,
      mode,
      tier,
      originSurcharge:      0,
      surchargeRate:        surge,
      surchargeLabel:       surgeLabel,
      clientSurchargeRate:  clientRate,
      clientSurchargeLabel: clientLabel,
      discountRate:         0,
      clientSegment:        segment,
    };
  }

  const { price: base, fixed, fullEntry } = sharedSuvBase(pickup, dropoff);
  const originSurcharge = getOriginSurcharge(pickup);

  const vehicle       = VEHICLE_TYPES[vehicleType] ?? VEHICLE_TYPES.suv;
  const isLargeVeh    = !['suv', 'suv_xl', 'other'].includes(vehicleType);
  const vehicleFactor = isLargeVeh ? vehicle.multiplierConfort : 1;

  let basePrice: number;
  if (fullEntry) {
    basePrice = mode === 'compartido'
      ? fullEntry.compartido
      : (tier === 'premium' ? fullEntry.premium : fullEntry.privado);
  } else if (mode === 'compartido') {
    basePrice = base;
  } else {
    const privadoConfort = Math.round(base * 4 * vehicleFactor / 10) * 10;
    basePrice = tier === 'premium' ? privadoConfort + 10 : privadoConfort;
  }

  // Interurbano: PRECIO FIJO. El surge dinamico (hora/dia) NO aplica aqui;
  // solo el recargo por segmento de cliente (agencia/empresa).
  const surchargeRate = 0;
  const surchargeLabel: string | null = null;
  const { rate: clientSurchargeRate, label: clientSurchargeLabel } = getClientSurcharge(segment);

  // Formula: base x (1 + recargo_cliente) + origen
  const adjustedPrice = Math.round(basePrice * (1 + surchargeRate + clientSurchargeRate));
  const totalFare     = adjustedPrice + originSurcharge;

  return {
    sharedBase:          base,
    totalFare,
    distanceKm:          roadDistance?.distanceKm ?? Math.round(dist * 10) / 10,
    durationMin:         roadDistance?.durationMin ?? Math.round((dist / AVERAGE_SPEED_KMH) * 60),
    isPriceFixed:        fixed,
    mode,
    tier,
    originSurcharge,
    surchargeRate,
    surchargeLabel,
    clientSurchargeRate,
    clientSurchargeLabel,
    discountRate:        0,  // solo por puntos de lealtad, gestionado por loyalty-service
    clientSegment:       segment,
  };
}

/**
 * Compat: devuelve Privado Confort sin contexto de precio.
 */
export function calculateFare(
  pickup:      Location,
  dropoff:     Location,
  vehicleType: VehicleType = 'suv',
): number {
  return getFareBreakdown(pickup, dropoff, vehicleType, 'confort', 'privado').totalFare;
}

export type { VehicleType as RideType };

/** Comprueba si la hora dada es hora pico (compat) */
export function isPeakHour(date: Date = new Date()): boolean {
  const h = date.getHours();
  return (h >= 6 && h < 9) || (h >= 17 && h < 20);
}
