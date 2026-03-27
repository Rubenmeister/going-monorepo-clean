/**
 * Fare calculation — precios fijos por par de ciudades (puerta a puerta)
 *
 * Modelo de precios:
 *  · Los valores de CITY_PAIR_PRICES son precio COMPARTIDO (3 pasajeros, SUV).
 *  · Privado Confort  = round(compartido × 4 / 10) × 10
 *  · Privado Premium  = Privado Confort + $10
 *
 * Recargo de origen (+$5):
 *  Se suma a cualquier tarifa cuando el punto de RECOGIDA es:
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

// ── Haversine ─────────────────────────────────────────────────
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

export function calculateEstimatedDuration(pickup: Location, dropoff: Location): number {
  return Math.round((calculateDistance(pickup, dropoff) / AVERAGE_SPEED_KMH) * 60);
}

// ── Normalización de nombre ───────────────────────────────────
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

// ── Recargo de origen (+$5) ───────────────────────────────────
// Se aplica cuando el punto de RECOGIDA pertenece a estas zonas.
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

// ── Rutas con precio COMPLETO predefinido (compartido / privado / premium) ──
// Estas rutas no siguen la fórmula ×4; se usan los valores exactos.
// El recargo de origen se aplica adicionalmente si el pickup lo requiere.
interface FullPriceEntry { compartido: number; privado: number; premium: number; }
const FULL_PRICE_ROUTES: Record<string, FullPriceEntry> = {
  // Quito Centro Norte ↔ Aeropuerto Tababela
  'aeropuerto quito tababela|quito centro norte': { compartido: 10, privado: 25, premium: 30 },
};

// ── Tabla de precios COMPARTIDO — SUV, un sentido, USD ────────
//
// Precio compartido ≈ 3 pasajeros.
// Privado Confort = round(este valor × 4 / 10) × 10
// Privado Premium = Privado Confort + $10
//
const CITY_PAIR_PRICES: Record<string, number> = {

  // ── Rutas hacia Quito Centro Norte ───────────────────────────
  'cayambe|quito centro norte':              7,
  'guayllabamba|quito centro norte':         6,
  // Ibarra / Atuntaqui / Otavalo / Peguche — misma tarifa (zona norte)
  'ibarra|quito centro norte':               11,
  'atuntaqui|quito centro norte':            11,
  'otavalo|quito centro norte':              11,
  'peguche|quito centro norte':              11,
  'cotacachi|quito centro norte':            11,
  'tabacundo|quito centro norte':            8,
  'el quinche|quito centro norte':           7,
  'pifo|quito centro norte':                 6,
  'quito centro norte|tulcan':               24,
  'latacunga|quito centro norte':            13,
  'tambillo|quito centro norte':             8,
  'aloasi|quito centro norte':               10,
  'machachi|quito centro norte':             9,
  'ambato|quito centro norte':               15,
  'banos|quito centro norte':                17,
  'quito centro norte|riobamba':             20,
  'quito centro norte|guaranda':             24,
  'quito centro norte|santo domingo':        14,
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
  // (todas con la misma tarifa — zona norte)
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
  'quito centro norte|salcedo':              10,
  'quito centro norte|pillaro':              11,
  'quito centro norte|cevallos':             12,
  'quito centro norte|tisaleo':              12,
  'quito centro norte|mocha':               13,

  // ── Ruta Santo Domingo: ciudades intermedias ──────────────────
  'el carmen|la concordia':                  7,
  'la concordia|santo domingo':              8,
  'la concordia|quito centro norte':         17,
  'aeropuerto quito tababela|la concordia':  20,

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

  // ── Rutas hacia Los Chillos / Sangolquí ─────────────────────
  'latacunga|los chillos  sangolqui':        14,
  'ambato|los chillos  sangolqui':           16,
  'banos|los chillos  sangolqui':            13,
  'los chillos  sangolqui|riobamba':         21,
  'cuenca|los chillos  sangolqui':           46,

  // ── Aeropuerto Quito (Tababela) ──────────────────────────────
  // (Quito Centro Norte ↔ Aeropuerto está en FULL_PRICE_ROUTES con precios especiales)
  'aeropuerto quito tababela|latacunga':     15,
  'aeropuerto quito tababela|ambato':        18,
  'aeropuerto quito tababela|banos':         18,
  'aeropuerto quito tababela|riobamba':      23,
  'aeropuerto quito tababela|guayllabamba':  5,
  'aeropuerto quito tababela|cayambe':       9,
  // Ibarra / Atuntaqui / Otavalo / Peguche — misma tarifa desde aeropuerto
  'aeropuerto quito tababela|ibarra':        14,
  'aeropuerto quito tababela|atuntaqui':     14,
  'aeropuerto quito tababela|otavalo':       14,
  'aeropuerto quito tababela|peguche':       14,
  'aeropuerto quito tababela|pifo':          5,
  'aeropuerto quito tababela|el quinche':    6,
  'aeropuerto quito tababela|cuenca':        47,
  'aeropuerto quito tababela|guayaquil':     52,
  'aeropuerto quito tababela|santo domingo': 17,
  'aeropuerto quito tababela|el carmen':     22,
  'aeropuerto quito tababela|quito sur':     12,
  'aeropuerto quito tababela|cumbaya  tumbaco valle': 8,
  'aeropuerto quito tababela|los chillos  sangolqui': 15,

  // ── Desde / hacia Guayaquil ──────────────────────────────────
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

  // ── Desde / hacia Cuenca ─────────────────────────────────────
  'azogues|cuenca':          5,
  'alausi|cuenca':           17,
  'cuenca|machala':          19,
  'cuenca|loja':             24,
  'cuenca|riobamba':         24,
  'ambato|cuenca':           29,
  'cuenca|zaruma':           29,
  'cuenca|latacunga':        34,
  'cuenca|macas':            34,

  // ── Sierra interna ───────────────────────────────────────────
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

  // ── Costa interna ────────────────────────────────────────────
  'manta|portoviejo':        4,
  'montanita|salinas':       9,
  'esmeraldas|manta':        44,
  'manta|salinas':           49,

  // ── Sur del país ─────────────────────────────────────────────
  'loja|zaruma':             17,
  'machala|zaruma':          19,
  'loja|machala':            29,

  // ── Amazonía ─────────────────────────────────────────────────
  'puyo|tena':               11,
  'lago agrio|tena':         34,
  'macas|puyo':              34,
  'macas|tena':              44,
};

// ── Fórmula de respaldo ───────────────────────────────────────
// Calibrada a: 90km→$13, 130km→$15, 190km→$20 (compartido)
function distanceBasedSharedPrice(km: number): number {
  if (km <= 15) return 4;
  if (km <= 40) return Math.round(3 + km * 0.20);
  return Math.max(7, Math.round(4.5 + km * 0.082));
}

// ── Lookup ────────────────────────────────────────────────────
function sharedSuvBase(
  pickup: Location,
  dropoff: Location,
): { price: number; fixed: boolean; fullEntry?: FullPriceEntry } {
  if (pickup.address && dropoff.address) {
    // 1. Primero revisar rutas con precio completo
    const fullKey = pairKey(pickup.address, dropoff.address);
    const fullEntry = FULL_PRICE_ROUTES[fullKey];
    if (fullEntry !== undefined) return { price: fullEntry.compartido, fixed: true, fullEntry };

    // 2. Luego tabla compartido estándar
    const p = CITY_PAIR_PRICES[fullKey];
    if (p !== undefined) return { price: p, fixed: true };
  }
  return {
    price: distanceBasedSharedPrice(calculateDistance(pickup, dropoff)),
    fixed: false,
  };
}

// ── API pública ───────────────────────────────────────────────

export interface FareBreakdown {
  /** Precio compartido (base de tabla o fórmula) — SUV */
  sharedBase:        number;
  /** Tarifa final mostrada al pasajero */
  totalFare:         number;
  distanceKm:        number;
  durationMin:       number;
  /** true = precio de tabla fija · false = estimado por distancia */
  isPriceFixed:      boolean;
  mode:              'privado' | 'compartido';
  tier:              'confort' | 'premium';
  /** Recargo aplicado por zona de origen */
  originSurcharge:   number;
}

/**
 * Calcula la tarifa final según:
 *  · Compartido               → sharedBase (+ recargo origen si aplica)
 *  · Privado Confort          → round(sharedBase × 4 / 10) × 10 (+ recargo)
 *  · Privado Premium          → Privado Confort + $10 (+ recargo)
 *
 *  Rutas especiales (ej. Quito ↔ Aeropuerto) usan precios exactos predefinidos.
 */
export function getFareBreakdown(
  pickup:      Location,
  dropoff:     Location,
  vehicleType: VehicleType = 'suv',
  tier:        'confort' | 'premium' = 'confort',
  mode:        'privado' | 'compartido' = 'privado',
): FareBreakdown {
  const dist = calculateDistance(pickup, dropoff);
  const { price: base, fixed, fullEntry } = sharedSuvBase(pickup, dropoff);
  const surcharge = getOriginSurcharge(pickup);

  // Vehicle factor (VAN/Minibús/Bus amplían el precio privado)
  const vehicle      = VEHICLE_TYPES[vehicleType] ?? VEHICLE_TYPES.suv;
  const isLargeVeh   = !['suv', 'suv_xl', 'other'].includes(vehicleType);
  const vehicleFactor = isLargeVeh ? vehicle.multiplierConfort : 1;

  let totalFare: number;

  if (fullEntry) {
    // Ruta con precio completo predefinido (ej. Quito ↔ Aeropuerto)
    if (mode === 'compartido') {
      totalFare = fullEntry.compartido + surcharge;
    } else {
      totalFare = (tier === 'premium' ? fullEntry.premium : fullEntry.privado) + surcharge;
    }
  } else if (mode === 'compartido') {
    totalFare = base + surcharge;
  } else {
    // Redondeamos a la decena más cercana
    const privadoConfort = Math.round(base * 4 * vehicleFactor / 10) * 10;
    totalFare = (tier === 'premium' ? privadoConfort + 10 : privadoConfort) + surcharge;
  }

  return {
    sharedBase:     base,
    totalFare,
    distanceKm:     Math.round(dist * 10) / 10,
    durationMin:    Math.round((dist / AVERAGE_SPEED_KMH) * 60),
    isPriceFixed:   fixed,
    mode,
    tier,
    originSurcharge: surcharge,
  };
}

/**
 * Compat con código que solo llama calculateFare(pickup, dropoff, vehicleType).
 * Por defecto devuelve Privado Confort.
 */
export function calculateFare(
  pickup:      Location,
  dropoff:     Location,
  vehicleType: VehicleType = 'suv',
): number {
  return getFareBreakdown(pickup, dropoff, vehicleType, 'confort', 'privado').totalFare;
}

export type { VehicleType as RideType };
export function isPeakHour(): boolean { return false; }
