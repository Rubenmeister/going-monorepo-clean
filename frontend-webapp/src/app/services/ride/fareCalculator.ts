/**
 * Fare calculation — precios fijos por par de ciudades (puerta a puerta)
 *
 * Modelo de precios:
 *  · Los valores de la tabla son precio COMPARTIDO (3 pasajeros, SUV).
 *  · Privado Confort  = compartido × 4
 *  · Privado Premium  = ceil(Privado Confort × 1.10)
 *
 * Quito se divide en 3 zonas: Centro Norte · Sur · Valles (Cumbayá/Tumbaco · Los Chillos)
 * y se incluyen ciudades intermedias en las rutas principales.
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

// ── Tabla de precios COMPARTIDO — SUV, un sentido, USD ────────
//
// Precio compartido ≈ 3 pasajeros.
// Privado Confort = este valor × 4.
// Privado Premium = ceil(Privado Confort × 1.10).
//
// Quito tiene 3 zonas:
//   "quito centro norte"  (Iñaquito, La Carolina, González Suárez, norte)
//   "quito sur"           (Quitumbe, Chillogallo, Guamaní)
//   "cumbaya  tumbaco valle" / "los chillos  sangolqui" (valles orientales)
//   "aeropuerto quito tababela"
const CITY_PAIR_PRICES: Record<string, number> = {

  // ── Rutas hacia Quito Centro Norte ───────────────────────────
  'cayambe|quito centro norte':              7,
  'guayllabamba|quito centro norte':         6,
  'otavalo|quito centro norte':              9,
  'cotacachi|quito centro norte':            11,
  'tabacundo|quito centro norte':            8,
  'ibarra|quito centro norte':               11,
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
  'aeropuerto quito tababela|latacunga':     15,
  'aeropuerto quito tababela|ambato':        18,
  'aeropuerto quito tababela|banos':         18,
  'aeropuerto quito tababela|riobamba':      23,
  'aeropuerto quito tababela|guayllabamba':  5,
  'aeropuerto quito tababela|cayambe':       9,
  'aeropuerto quito tababela|ibarra':        14,
  'aeropuerto quito tababela|otavalo':       12,
  'aeropuerto quito tababela|pifo':          5,
  'aeropuerto quito tababela|el quinche':    6,
  'aeropuerto quito tababela|cuenca':        47,
  'aeropuerto quito tababela|guayaquil':     52,
  'aeropuerto quito tababela|santo domingo': 17,

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
): { price: number; fixed: boolean } {
  if (pickup.address && dropoff.address) {
    const key = pairKey(pickup.address, dropoff.address);
    const p = CITY_PAIR_PRICES[key];
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
}

/**
 * Calcula la tarifa final según:
 *  · Compartido               → sharedBase
 *  · Privado Confort          → sharedBase × 4
 *  · Privado Premium          → ceil(Privado Confort × 1.10)
 */
export function getFareBreakdown(
  pickup:      Location,
  dropoff:     Location,
  vehicleType: VehicleType = 'suv',
  tier:        'confort' | 'premium' = 'confort',
  mode:        'privado' | 'compartido' = 'privado',
): FareBreakdown {
  const dist                    = calculateDistance(pickup, dropoff);
  const { price: base, fixed }  = sharedSuvBase(pickup, dropoff);

  // Vehicle factor (VAN/Minibús/Bus amplían el precio privado)
  const vehicle      = VEHICLE_TYPES[vehicleType] ?? VEHICLE_TYPES.suv;
  const isLargeVeh   = !['suv', 'suv_xl', 'other'].includes(vehicleType);
  const vehicleFactor = isLargeVeh ? vehicle.multiplierConfort : 1;

  let totalFare: number;
  if (mode === 'compartido') {
    totalFare = base;                                            // precio compartido
  } else {
    // Redondeamos a la decena más cercana
    const privadoConfort = Math.round(base * 4 * vehicleFactor / 10) * 10;
    totalFare = tier === 'premium'
      ? privadoConfort + 10                                      // privado premium = confort + $10
      : privadoConfort;                                          // privado confort
  }

  return {
    sharedBase:  base,
    totalFare,
    distanceKm:  Math.round(dist * 10) / 10,
    durationMin: Math.round((dist / AVERAGE_SPEED_KMH) * 60),
    isPriceFixed: fixed,
    mode,
    tier,
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
