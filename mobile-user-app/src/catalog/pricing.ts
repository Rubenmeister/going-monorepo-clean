/**
 * Pricing canónico del frontend Going (mobile).
 *
 * Por ahora estas tarifas viven en el frontend; el backend tiene su
 * propio cálculo en libs/pricing con FARES + applyDynamicPricing. Cuando
 * unifiquemos, el frontend pedirá quotes al backend en vez de calcular
 * local (autoritative pricing — TODO).
 */
import { CityId, QuitoZone, TripMode, VehicleId } from './types';
import { GOING_SHARED_ROUTES } from './routes';
import { QUITO_ZONES } from './zones';
import { VEHICLE_SPECS } from './vehicles';

/** Tarifa por persona según ciudad de origen y clase de vehículo. */
export const PERSON_RATES: Record<CityId, { suv: number; van: number; bus: number }> = {
  // ── Rutas Going principales ────────────────────────────────────────────
  aeropuerto_quito: { suv: 12, van: 10, bus: 9  },
  quito:            { suv: 10, van: 8,  bus: 7  },
  // ── Sierra Centro ─────────────────────────────────────────────────────
  ambato:    { suv: 9,  van: 8,  bus: 7  },
  banos:     { suv: 12, van: 10, bus: 9  },
  latacunga: { suv: 8,  van: 7,  bus: 6  },
  salcedo:   { suv: 9,  van: 8,  bus: 7  },
  pillaro:   { suv: 10, van: 8,  bus: 7  },
  cevallos:  { suv: 10, van: 8,  bus: 7  },
  tisaleo:   { suv: 10, van: 8,  bus: 7  },
  mocha:     { suv: 11, van: 9,  bus: 8  },
  // ── Sierra Norte ──────────────────────────────────────────────────────
  ibarra:    { suv: 11, van: 9,  bus: 8  },
  otavalo:   { suv: 12, van: 10, bus: 9  },
  atuntaqui: { suv: 12, van: 10, bus: 9  },
  peguche:   { suv: 12, van: 10, bus: 9  },
  tulcan:    { suv: 18, van: 15, bus: 13 },
  // ── Costa / Santo Domingo ─────────────────────────────────────────────
  el_carmen:    { suv: 14, van: 12, bus: 10 },
  la_concordia: { suv: 13, van: 11, bus: 9  },
  santo_domingo:{ suv: 13, van: 11, bus: 9  },
  // ── Resto Ecuador ─────────────────────────────────────────────────────
  guayaquil:  { suv: 18, van: 15, bus: 13 },
  cuenca:     { suv: 20, van: 17, bus: 15 },
  riobamba:   { suv: 17, van: 14, bus: 12 },
  loja:       { suv: 25, van: 21, bus: 18 },
  manta:      { suv: 22, van: 18, bus: 16 },
  portoviejo: { suv: 22, van: 18, bus: 16 },
  esmeraldas: { suv: 20, van: 17, bus: 15 },
  machala:    { suv: 23, van: 19, bus: 17 },
  babahoyo:   { suv: 19, van: 16, bus: 14 },
  lago_agrio: { suv: 28, van: 24, bus: 20 },
  tena:       { suv: 25, van: 21, bus: 18 },
  puyo:       { suv: 22, van: 18, bus: 16 },
  macas:      { suv: 28, van: 24, bus: 20 },
  zamora:     { suv: 30, van: 25, bus: 22 },
  guaranda:   { suv: 18, van: 15, bus: 13 },
};

/**
 * Calcula el precio del viaje:
 *   - Compartido → tarifa por persona (1 asiento)
 *   - Privado    → tarifa por persona × capacidad del vehículo (vehículo completo)
 */
export function calcPrice(city: CityId, vehicleId: VehicleId, mode: TripMode): number {
  const rates = PERSON_RATES[city];
  const { rateClass, capacity } = VEHICLE_SPECS[vehicleId];
  const perPerson = rates[rateClass];
  return mode === 'compartido' ? perPerson : perPerson * capacity;
}

/**
 * Calcula el precio de un asiento en viaje compartido específico.
 *   - originStop: nombre de la parada de origen (ej: 'Ambato', 'Quito')
 *   - zone:       zona destino en Quito (aplica surcharge cuando termina en Quito)
 *   - frontSeat:  +$3 si elige asiento delantero
 *   - routeId:    ID de ruta específica (opcional, mejora precisión)
 */
export function calcSharedSeatPrice(
  originStop: string,
  zone: QuitoZone = 'quito_norte',
  frontSeat = false,
  routeId?: string,
): number {
  const route = routeId
    ? GOING_SHARED_ROUTES.find(r => r.id === routeId)
    : GOING_SHARED_ROUTES.find(r => r.stopPrices[originStop] !== undefined);

  const base  = route?.stopPrices[originStop] ?? 10;
  const isDestinationQuito = route?.direction === 'ida' || !route;
  const surge = isDestinationQuito
    ? (QUITO_ZONES.find(z => z.id === zone)?.surcharge ?? 0)
    : 0;

  return base + surge + (frontSeat ? 3 : 0);
}
