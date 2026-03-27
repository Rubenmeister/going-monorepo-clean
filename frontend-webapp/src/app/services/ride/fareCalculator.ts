/**
 * Fare calculation — precios fijos por par de ciudades (puerta a puerta)
 *
 * Lógica:
 *  1. Se busca el par de ciudades en la tabla CITY_PAIR_PRICES (precio SUV Confort).
 *  2. Si no se encuentra, se aplica la fórmula de respaldo calibrada al mercado.
 *  3. El resultado se multiplica por el multiplicador del tipo de vehículo
 *     (multiplierConfort) para mantener compatibilidad con RideRequestForm,
 *     que divide por multiplierConfort y multiplica por el multiplicador de tier.
 *
 * Precios en USD · ida · SUV Confort base
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

// Velocidad promedio interurbana Ecuador (carretera, no autopista)
const AVERAGE_SPEED_KMH = 75;

export function calculateEstimatedDuration(pickup: Location, dropoff: Location): number {
  return Math.round((calculateDistance(pickup, dropoff) / AVERAGE_SPEED_KMH) * 60);
}

// ── Normalización de nombre de ciudad ────────────────────────
function normalizeCity(address: string): string {
  return address
    .split(',')[0]                          // primer componente antes de la coma
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')        // sin diacríticos (ó → o, etc.)
    .replace(/[^a-z\s]/g, '')
    .trim();
}

function pairKey(a: string, b: string): string {
  const na = normalizeCity(a);
  const nb = normalizeCity(b);
  return na <= nb ? `${na}|${nb}` : `${nb}|${na}`;
}

// ── Tabla de precios fijos — SUV Confort, un sentido, USD ────
//
// Referencia: tarifas vigentes de empresas puerta-a-puerta Ecuador.
// Ejemplos base del operador: Latacunga→Quito $13, Ambato→Quito $15,
// Riobamba→Quito $20.
const CITY_PAIR_PRICES: Record<string, number> = {

  // ── Desde / hacia Quito ──────────────────────────────────
  'cayambe|quito':           8,
  'otavalo|quito':           10,
  'ibarra|quito':            12,
  'cotacachi|quito':         12,
  'latacunga|quito':         13,
  'ambato|quito':            15,
  'quito|santo domingo':     15,
  'banos|quito':             18,
  'guaranda|quito':          25,
  'quito|tulcan':            25,
  'quito|riobamba':          20,
  'quito|tena':              30,
  'esmeraldas|quito':        30,
  'alausi|quito':            30,
  'quito|puyo':              35,
  'lago agrio|quito':        40,
  'nueva loja|quito':        40,
  'quito|cuenca':            45,
  'manta|quito':             50,
  'portoviejo|quito':        50,
  'quito|guayaquil':         50,
  'quito|salinas':           60,
  'montanita|quito':         55,
  'macas|quito':             55,
  'machala|quito':           65,
  'quito|zaruma':            65,
  'loja|quito':              70,

  // ── Desde / hacia Guayaquil ──────────────────────────────
  'guayaquil|naranjal':      12,
  'guayaquil|salinas':       15,
  'guayaquil|montanita':     18,
  'guayaquil|machala':       20,
  'alausi|guayaquil':        25,
  'cuenca|guayaquil':        25,
  'guayaquil|riobamba':      30,
  'guayaquil|manta':         30,
  'guayaquil|portoviejo':    30,
  'guayaquil|santo domingo': 30,
  'guayaquil|zaruma':        30,
  'ambato|guayaquil':        35,
  'banos|guayaquil':         35,
  'guayaquil|latacunga':     40,
  'guayaquil|loja':          40,
  'esmeraldas|guayaquil':    55,
  'guayaquil|ibarra':        55,

  // ── Desde / hacia Cuenca ─────────────────────────────────
  'azogues|cuenca':          5,
  'alausi|cuenca':           18,
  'cuenca|machala':          20,
  'cuenca|loja':             25,
  'cuenca|riobamba':         25,
  'ambato|cuenca':           30,
  'cuenca|zaruma':           30,
  'cuenca|latacunga':        35,
  'cuenca|macas':            35,

  // ── Sierra interna ───────────────────────────────────────
  'ibarra|otavalo':          5,
  'ambato|banos':            6,
  'latacunga|ambato':        6,
  'cotacachi|ibarra':        8,
  'ambato|riobamba':         8,
  'latacunga|riobamba':      12,
  'alausi|riobamba':         12,
  'ibarra|tulcan':           15,
  'ambato|puyo':             15,
  'cayambe|ibarra':          15,
  'ambato|tena':             18,
  'ibarra|latacunga':        20,

  // ── Costa interna ────────────────────────────────────────
  'manta|portoviejo':        5,
  'montanita|salinas':       10,
  'esmeraldas|manta':        45,
  'manta|salinas':           50,

  // ── Sur del país ─────────────────────────────────────────
  'loja|zaruma':             18,
  'machala|zaruma':          20,
  'loja|machala':            30,

  // ── Amazonía ─────────────────────────────────────────────
  'puyo|tena':               12,
  'lago agrio|tena':         35,
  'macas|puyo':              35,
  'macas|tena':              45,
};

// ── Fórmula de respaldo (distancia haversine) ────────────────
// Calibrada a: 90km→$13, 130km→$15, 190km→$20
function distanceBasedSuvPrice(km: number): number {
  if (km <= 15) return 5;
  if (km <= 40) return Math.round(4 + km * 0.20);
  return Math.max(8, Math.round(4.5 + km * 0.082));
}

// ── Lookup principal ─────────────────────────────────────────
function suvConfortBase(pickup: Location, dropoff: Location): { price: number; fixed: boolean } {
  if (pickup.address && dropoff.address) {
    const key = pairKey(pickup.address, dropoff.address);
    const fixed = CITY_PAIR_PRICES[key];
    if (fixed !== undefined) return { price: fixed, fixed: true };
  }
  const dist = calculateDistance(pickup, dropoff);
  return { price: distanceBasedSuvPrice(dist), fixed: false };
}

// ── API pública ───────────────────────────────────────────────

/**
 * Tarifa estimada para mostrar al pasajero.
 *
 * Retorna: suvBase × multiplierConfort(vehicleType)
 * Compatible con el patrón de RideRequestForm:
 *   fare = (calculateFare(…) / multiplierConfort) × tierMultiplier
 */
export function calculateFare(
  pickup: Location,
  dropoff: Location,
  vehicleType: VehicleType = 'suv',
): number {
  const vehicle = VEHICLE_TYPES[vehicleType] ?? VEHICLE_TYPES.suv;
  const { price } = suvConfortBase(pickup, dropoff);
  return Math.round(price * vehicle.multiplierConfort * 100) / 100;
}

export interface FareBreakdown {
  /** Precio base SUV Confort para el par de ciudades */
  suvConfortPrice:   number;
  /** Multiplicador del vehículo (relativo a SUV Confort) */
  vehicleMultiplier: number;
  /** Multiplicador del tier aplicado */
  tierMultiplier:    number;
  /** Tarifa final mostrada al pasajero */
  totalFare:         number;
  distanceKm:        number;
  durationMin:       number;
  /** true = precio de tabla fija · false = estimado por distancia */
  isPriceFixed:      boolean;
}

export function getFareBreakdown(
  pickup: Location,
  dropoff: Location,
  vehicleType: VehicleType = 'suv',
  tier: 'confort' | 'premium' = 'confort',
): FareBreakdown {
  const vehicle   = VEHICLE_TYPES[vehicleType] ?? VEHICLE_TYPES.suv;
  const dist      = calculateDistance(pickup, dropoff);
  const { price: suvBase, fixed } = suvConfortBase(pickup, dropoff);
  const tierMult  = tier === 'premium' ? vehicle.multiplierPremium : vehicle.multiplierConfort;
  const totalFare = Math.round(suvBase * tierMult * 100) / 100;

  return {
    suvConfortPrice:   suvBase,
    vehicleMultiplier: vehicle.multiplierConfort,
    tierMultiplier:    tierMult,
    totalFare,
    distanceKm:        Math.round(dist * 10) / 10,
    durationMin:       Math.round((dist / AVERAGE_SPEED_KMH) * 60),
    isPriceFixed:      fixed,
  };
}

// ── Legacy compat ─────────────────────────────────────────────
export type { VehicleType as RideType };
/** Peak hours no aplican a transporte interurbano */
export function isPeakHour(): boolean { return false; }
