import { Injectable } from '@nestjs/common';
import { getFare } from './fares';
import { CARPOOL_SEATING } from './seats';
import { classifyRoute } from './cities';

// ── Envíos: tamaño de paquete → peso representativo (tiers de calcEnvio) ──────
// El cliente elige tamaño; el backend lo mapea a peso para cotizar de forma
// autoritativa. Valores provisionales.
export const PACKAGE_SIZE_WEIGHT_KG: Record<'small' | 'medium' | 'large', number> = {
  small: 5,
  medium: 15,
  large: 25,
};

export function sizeToWeightKg(size?: 'small' | 'medium' | 'large'): number {
  return PACKAGE_SIZE_WEIGHT_KG[size ?? 'small'];
}

// ════════════════════════════════════════════════════════════════
// FERIADOS NACIONALES — ECUADOR
// ════════════════════════════════════════════════════════════════

/** Meeus/Jones/Butcher — fecha de Pascua para el año dado */
function easterDate(year: number): Date {
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
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function buildHolidaySet(year: number): Set<string> {
  const fmt = (m: number, d: number) =>
    `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const fixed = [
    fmt(1, 1), fmt(5, 1), fmt(5, 24), fmt(8, 10),
    fmt(10, 9), fmt(11, 1), fmt(11, 3), fmt(12, 25),
  ];
  const easter      = easterDate(year);
  const carnivalMon = addDays(easter, -48);
  const carnivalTue = addDays(easter, -47);
  const goodFriday  = addDays(easter, -2);
  const variable    = [carnivalMon, carnivalTue, goodFriday].map(
    (d) => fmt(d.getMonth() + 1, d.getDate()),
  );
  return new Set([...fixed, ...variable]);
}

const _holidayCache: Record<number, Set<string>> = {};
function getHolidaySet(year: number): Set<string> {
  if (!_holidayCache[year]) _holidayCache[year] = buildHolidaySet(year);
  return _holidayCache[year];
}

export function isEcuadorHoliday(date: Date): boolean {
  const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return getHolidaySet(date.getFullYear()).has(key);
}

// ════════════════════════════════════════════════════════════════
// RECARGOS Y DESCUENTOS DINÁMICOS
// ════════════════════════════════════════════════════════════════

export type RideMode     = 'privado' | 'compartido';
export type ClientSegment = 'public' | 'agency' | 'corporate';

/**
 * Tasa de recargo dinámico (0–1) para una fecha/hora y modo.
 *
 * Hora pico mañana  06–09  → privado 0.15 / compartido 0.08
 * Hora pico tarde   17–20  → privado 0.15 / compartido 0.08
 * Noche             22–05  → privado 0.20 / compartido 0.10
 * Fin de semana            → privado 0.10 / compartido 0.05
 * Feriado nacional         → privado 0.25 / compartido 0.12
 *
 * El recargo de tiempo y el recargo de día se SUMAN si coinciden.
 * Dentro del recargo de día se toma el MAYOR (feriado > fin de semana).
 */
export function getDynamicSurchargeRate(
  date: Date,
  mode: RideMode,
): number {
  const hour     = date.getHours();
  const isShared = mode === 'compartido';
  const dow      = date.getDay();

  // Tiempo
  let timeRate = 0;
  if (hour >= 22 || hour < 5)        timeRate = isShared ? 0.10 : 0.20;
  else if ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 20))
                                     timeRate = isShared ? 0.08 : 0.15;

  // Día
  let dayRate = 0;
  if (isEcuadorHoliday(date))         dayRate = isShared ? 0.12 : 0.25;
  else if (dow === 0 || dow === 6)    dayRate = isShared ? 0.05 : 0.10;

  return timeRate + dayRate;
}

/**
 * Recargo por segmento de cliente (0–1):
 *  · Agencias  +25% — Going abona la comisión al intermediario desde este recargo
 *  · Empresas  +25% — servicio premium (vehículo top, conductor mejor calificado,
 *                      espera sin cobro extra, facturación diferida)
 *  · Público   0%
 *
 * Los descuentos por puntos son independientes y los gestiona loyalty-service.
 */
export function getClientSurchargeRate(segment: ClientSegment): number {
  if (segment === 'agency' || segment === 'corporate') return 0.25;
  return 0;
}

/**
 * Aplica todos los recargos al precio base y devuelve la tarifa final.
 * El recargo de origen (+$5 fijo) se suma al final.
 *
 * Fórmula:
 *   total = round(base × (1 + surchargeTime + surchargeClient) × (1 − discountPoints))
 *           + originSurcharge
 *
 * discountPoints = 0 por defecto (loyalty-service lo calcula si aplica)
 */
export function applyDynamicPricing(params: {
  basePrice:        number;
  mode:             RideMode;
  dateTime:         Date;
  clientSegment:    ClientSegment;
  originSurcharge?: number;
  discountRate?:    number;  // puntos acumulados, 0 por defecto
}): {
  adjustedPrice:       number;
  timeSurchargeRate:   number;
  clientSurchargeRate: number;
  discountRate:        number;
  originSurcharge:     number;
} {
  const timeSurchargeRate   = getDynamicSurchargeRate(params.dateTime, params.mode);
  const clientSurchargeRate = getClientSurchargeRate(params.clientSegment);
  const discountRate        = params.discountRate ?? 0;
  const originSurcharge     = params.originSurcharge ?? 0;
  const adjustedPrice       = Math.round(
    params.basePrice * (1 + timeSurchargeRate + clientSurchargeRate) * (1 - discountRate)
  ) + originSurcharge;
  return { adjustedPrice, timeSurchargeRate, clientSurchargeRate, discountRate, originSurcharge };
}

// ── Zonas de destino dentro de Quito ──────────────────────────────────────────
// Recargo adicional al precio base según la zona de llegada
export type QuitoZone =
  | 'quito_norte'    // La Y, Cotocollao, Carapungo, El Condado       → base
  | 'quito_centro'   // Centro Histórico, La Marín, El Ejido           → +$1
  | 'quito_sur'      // El Recreo, Quitumbe, Guajaló                  → +$1
  | 'valles'         // Cumbayá, Tumbaco, Sangolquí, Los Chillos       → +$2
  | 'aeropuerto';    // Tababela (Aeropuerto Internacional)            → +$15

export const QUITO_ZONE_SURCHARGE: Record<QuitoZone, number> = {
  quito_norte:  0,
  quito_centro: 1,
  quito_sur:    1,
  valles:       2,
  aeropuerto:   15,
};

// ── Rutas oficiales de Viaje Compartido Going ─────────────────────────────────
// @deprecated Los precios `stopPrices` aquí son INCORRECTOS — diferían de la
// tabla oficial FARES (ver libs/pricing/lib/fares.ts). Verificado con ops
// 2026-05-17: Ambato→Quito real es $15, no $10. Usar FARES.shared[...] como
// source of truth. Esta constante se mantiene solo porque calcSharedRoute la
// usa internamente; refactor pendiente para que también consuma FARES.
export const GOING_SHARED_ROUTES = [
  {
    id:        'sierra_centro',
    label:     'Sierra Centro → Quito',
    stops:     ['Riobamba', 'Ambato', 'Latacunga', 'Quito'],
    basePrice: { suv: 9, van: 8 },  // precio por asiento desde origen de ruta
    // Precio desde cada parada (SUV, por asiento)
    stopPrices: {
      Riobamba: 17,
      Ambato:   10,
      Latacunga: 8,
      Quito:     0,
    },
  },
  {
    id:        'costa_quito',
    label:     'Costa → Quito',
    stops:     ['El Carmen', 'La Concordia', 'Santo Domingo', 'Quito'],
    basePrice: { suv: 14, van: 12 },
    stopPrices: {
      'El Carmen':     14,
      'La Concordia':  13,
      'Santo Domingo': 11,
      Quito:            0,
    },
  },
  {
    id:        'sierra_norte',
    label:     'Sierra Norte → Quito',
    stops:     ['Ibarra', 'Otavalo', 'Quito'],
    basePrice: { suv: 11, van: 9 },
    stopPrices: {
      Ibarra:  11,
      Otavalo: 9,
      Quito:    0,
    },
  },
] as const;

/**
 * PricingService
 * Calculates fare and fee split dynamically per service type.
 *
 * Service types supported:
 *  - transport  : distance-based fare (base + per-km)
 *  - shared     : shared ride — lower base, higher per-km
 *  - envio      : parcel delivery — weight-based flat + distance
 *  - accommodation : fixed nightly rate (no dynamic calc needed here)
 *  - tour       : fixed per-person rate
 *  - experience : fixed per-person rate
 */

export type ServiceType =
  | 'transport'
  | 'shared'
  | 'shared_route'   // viaje compartido en ruta programada Going
  | 'envio'
  | 'accommodation'
  | 'tour'
  | 'experience';

export interface FareBreakdown {
  subtotal: number; // before platform fee
  platformFee: number; // Going's cut
  providerAmount: number; // driver / host / operator receives
  total: number;
  currency: string;
  breakdown: Record<string, number>;
}

interface TransportInput {
  serviceType: 'transport' | 'shared';
  distanceKm: number;
  durationMinutes: number;
  surgeMultiplier?: number;
}

interface EnvioInput {
  serviceType: 'envio';
  distanceKm: number;
  weightKg: number;
  isIntercity?: boolean;
  originCity?: string;
  destinationCity?: string;
  isOverVolume?: boolean;
}

interface FixedInput {
  serviceType: 'accommodation' | 'tour' | 'experience';
  baseAmount: number; // price set by host/operator
  quantity?: number; // nights or persons
}

// Viaje compartido en ruta programada Going
interface SharedRouteInput {
  serviceType: 'shared_route';
  originStop:  string;          // ej. 'Ambato'
  quitoZone?:  QuitoZone;      // zona de destino dentro de Quito
  vehicleType: 'suv' | 'van';
  frontSeat?:  boolean;         // asiento delantero +$3
  passengers?: number;          // número de asientos (default 1)
}

type PricingInput = TransportInput | EnvioInput | FixedInput | SharedRouteInput;

// ── Rate config (can be moved to DB/config service later) ────────
const RATES = {
  transport: {
    baseFare: 2.5,
    perKm: 0.55,
    perMinute: 0.1,
    platformFeePct: 0.2,
  },
  shared: {
    baseFare: 1.5,
    perKm: 0.35,
    perMinute: 0.08,
    platformFeePct: 0.2,
  },
  envio: {
    baseFare: 3.0,
    perKm: 0.45,
    perKg: 0.5,
    platformFeePct: 0.18,
  },
  accommodation: { platformFeePct: 0.12 },
  tour: { platformFeePct: 0.15 },
  experience: { platformFeePct: 0.15 },
};

// ── Envío URBANO: dinámico por distancia + tamaño, acotado a [$3, $10] ─────────
// En ciudades grandes el precio varía con la distancia punto a punto; el tamaño
// (3 tiers) suma un recargo. Valores PROVISIONALES — ajustables en un solo lugar.
const URBAN_ENVIO = {
  baseFare: 3,   // mínimo (envío corto, pequeño)
  perKm: 0.35,   // recargo por km recorrido
  maxFare: 10,   // tope urbano
  sizeSurcharge: { small: 0, medium: 1.5, large: 3 } as Record<
    'small' | 'medium' | 'large',
    number
  >,
};

/** Tamaño del envío derivado del peso (mismos cortes que los tiers interurbanos). */
function weightToEnvioSize(weightKg: number): 'small' | 'medium' | 'large' {
  if (weightKg <= 10) return 'small';
  if (weightKg <= 20) return 'medium';
  return 'large';
}

@Injectable()
export class PricingService {
  calculate(input: PricingInput): FareBreakdown {
    switch (input.serviceType) {
      case 'transport':
      case 'shared':
        return this.calcTransport(input as TransportInput);
      case 'shared_route':
        return this.calcSharedRoute(input as SharedRouteInput);
      case 'envio':
        return this.calcEnvio(input as EnvioInput);
      case 'accommodation':
      case 'tour':
      case 'experience':
        return this.calcFixed(input as FixedInput);
    }
  }

  /**
   * Calcula tarifa de viaje compartido en ruta programada Going.
   * Precio base según parada de origen + recargo por zona de destino en Quito.
   *
   * Ejemplo: Ambato → Aeropuerto (SUV, asiento delantero)
   *   = $10 (Ambato) + $15 (aeropuerto) + $3 (delantero) = $28
   */
  calcSharedRoute(input: SharedRouteInput): FareBreakdown {
    // Buscar el precio base de la parada de origen
    const route = GOING_SHARED_ROUTES.find(r =>
      Object.keys(r.stopPrices).includes(input.originStop)
    );

    const basePerSeat = route
      ? (route.stopPrices as any)[input.originStop] ?? 10
      : 10;

    const vehicleBase = input.vehicleType === 'van'
      ? Math.max(0, basePerSeat - 2) // VAN es ~$2 menos que SUV
      : basePerSeat;

    const zoneSurcharge   = QUITO_ZONE_SURCHARGE[input.quitoZone ?? 'quito_norte'];
    const frontSeatExtra  = input.frontSeat ? 3 : 0;
    const passengers      = input.passengers ?? 1;

    const pricePerSeat    = vehicleBase + zoneSurcharge + frontSeatExtra;
    const subtotal        = round(pricePerSeat * passengers);
    const platformFee     = round(subtotal * RATES.shared.platformFeePct);
    const providerAmount  = round(subtotal - platformFee);

    return {
      subtotal,
      platformFee,
      providerAmount,
      total: subtotal,
      currency: 'USD',
      breakdown: {
        basePerSeat:     vehicleBase,
        zoneSurcharge,
        frontSeatExtra,
        passengers,
        pricePerSeat,
      },
    };
  }

  private calcTransport(input: TransportInput): FareBreakdown {
    const r = RATES[input.serviceType];
    const surge = input.surgeMultiplier ?? 1.0;
    const distanceCost = input.distanceKm * r.perKm;
    const timeCost = input.durationMinutes * r.perMinute;
    const subtotal = round((r.baseFare + distanceCost + timeCost) * surge);
    const platformFee = round(subtotal * r.platformFeePct);
    const providerAmount = round(subtotal - platformFee);
    return {
      subtotal,
      platformFee,
      providerAmount,
      total: subtotal,
      currency: 'USD',
      breakdown: {
        baseFare: r.baseFare,
        distanceCost: round(distanceCost),
        timeCost: round(timeCost),
        surgeMultiplier: surge,
      },
    };
  }

  private calcEnvio(input: EnvioInput): FareBreakdown {
    const r = RATES.envio;
    let subtotal = 0;
    const breakdown: Record<string, number> = {};

    if (!input.isIntercity) {
      // Urbano DINÁMICO: base + distancia + recargo por tamaño, acotado [3, 10].
      const size = weightToEnvioSize(input.weightKg);
      const distanceComponent = URBAN_ENVIO.perKm * (input.distanceKm ?? 0);
      const sizeSurcharge = URBAN_ENVIO.sizeSurcharge[size];
      const raw = URBAN_ENVIO.baseFare + distanceComponent + sizeSurcharge;
      subtotal = Math.min(
        URBAN_ENVIO.maxFare,
        Math.max(URBAN_ENVIO.baseFare, round(raw)),
      );
      breakdown.baseFare = URBAN_ENVIO.baseFare;
      breakdown.distanceKm = round(input.distanceKm ?? 0);
      breakdown.distanceComponent = round(distanceComponent);
      breakdown.sizeSurcharge = sizeSurcharge;
      breakdown.urbanDynamic = 1;
    } else {
      // Intercity Same-Day Door-to-Door
      if (input.isOverVolume) {
        // Charged as seat equivalent
        const origin = input.originCity || 'Quito';
        const dest = input.destinationCity || 'Santo Domingo';
        const seatFare = getFare(origin, dest) || 15; // default 15 if not found
        subtotal = seatFare;
        breakdown.overVolumeSeatEquivalent = seatFare;
        breakdown.isOverVolume = 1;
      } else {
        // Tiers: 0-10kg: $10, 10-20kg: $15, 20kg+: $20
        if (input.weightKg <= 10) {
          subtotal = 10.00;
          breakdown.tier1_0_10kg = 10.00;
        } else if (input.weightKg <= 20) {
          subtotal = 15.00;
          breakdown.tier2_10_20kg = 15.00;
        } else {
          subtotal = 20.00;
          breakdown.tier3_over_20kg = 20.00;
        }
      }
      breakdown.isIntercity = 1;
    }

    const platformFee = round(subtotal * r.platformFeePct);
    const providerAmount = round(subtotal - platformFee);

    return {
      subtotal,
      platformFee,
      providerAmount,
      total: subtotal,
      currency: 'USD',
      breakdown,
    };
  }

  /**
   * Valida y recalcula una tarifa intercity en confirmación de reserva.
   * El frontend envía el precio base de la tabla; el backend aplica los factores
   * dinámicos de forma independiente para evitar manipulación del precio.
   *
   * @param basePrice     Precio de tabla (compartido o privado) sin ajustes
   * @param mode          'privado' | 'compartido'
   * @param serviceDateTime  Fecha/hora del servicio
   * @param clientSegment Segmento del cliente
   * @param originSurcharge Recargo fijo de origen ($5 o $0)
   */
  calcIntercityFare(params: {
    basePrice:        number;
    mode:             RideMode;
    serviceDateTime:  Date;
    clientSegment:    ClientSegment;
    originSurcharge?: number;
  }): FareBreakdown & {
    timeSurchargeRate:   number;
    clientSurchargeRate: number;
    discountRate:        number;
    originSurcharge:     number;
  } {
    const { adjustedPrice, timeSurchargeRate, clientSurchargeRate, discountRate, originSurcharge } =
      applyDynamicPricing({
        basePrice:       params.basePrice,
        mode:            params.mode,
        dateTime:        params.serviceDateTime,
        clientSegment:   params.clientSegment,
        originSurcharge: params.originSurcharge ?? 0,
      });

    const platformFeePct = RATES.shared.platformFeePct; // 20%
    const platformFee    = round(adjustedPrice * platformFeePct);
    const providerAmount = round(adjustedPrice - platformFee);

    return {
      subtotal:            adjustedPrice,
      platformFee,
      providerAmount,
      total:               adjustedPrice,
      currency:            'USD',
      timeSurchargeRate,
      clientSurchargeRate,
      discountRate,
      originSurcharge,
      breakdown: {
        basePrice:           params.basePrice,
        timeSurchargeRate,
        clientSurchargeRate,
        discountRate,
        originSurcharge,
      },
    };
  }

  /**
   * Precio de una reserva de asientos en un viaje compartido programado.
   *
   * Precio por asiento = tarifa de mercado FARES(origen→destino) — la misma
   * tabla autoritativa que usa el resto del sistema (cotización = cobro).
   * El asiento extra de grupo (centro trasero) va incluido en `seats` al mismo
   * precio. El delantero exclusivo agrega su recargo fijo una sola vez.
   */
  calcCarpoolSeats(params: {
    originCity: string;
    destCity: string;
    vehicleType: 'suv' | 'suv_xl';
    seats: number;
    frontExclusive?: boolean;
  }): {
    perSeat: number;
    seats: number;
    seatsSubtotal: number;
    frontSurcharge: number;
    total: number;
    currency: string;
    platformFee: number;
    providerAmount: number;
  } {
    const perSeat = getFare(params.originCity, params.destCity) ?? 0;
    const seating = CARPOOL_SEATING[params.vehicleType];
    const frontSurcharge = params.frontExclusive ? seating?.frontSeatSurcharge ?? 0 : 0;
    const seatsSubtotal = round(perSeat * params.seats);
    const total = round(seatsSubtotal + frontSurcharge);
    const platformFee = round(total * RATES.shared.platformFeePct);
    const providerAmount = round(total - platformFee);
    return {
      perSeat,
      seats: params.seats,
      seatsSubtotal,
      frontSurcharge,
      total,
      currency: 'USD',
      platformFee,
      providerAmount,
    };
  }

  /**
   * Cotización autoritativa de un envío a partir de coordenadas + tamaño.
   * Clasifica urbano/interurbano por geocercas (mismo resolver que el buscador)
   * y aplica calcEnvio. El backend usa ESTO; el precio que mande el cliente se
   * ignora. `inCoverage=false` → el caller debe rechazar el pedido.
   */
  quoteEnvio(params: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    weightKg?: number;
    packageSize?: 'small' | 'medium' | 'large';
    isOverVolume?: boolean;
  }): {
    price: number;
    currency: string;
    inCoverage: boolean;
    routeClass: string;
    isIntercity: boolean;
    originCity: string | null;
    destinationCity: string | null;
    weightKg: number;
    breakdown: Record<string, number>;
  } {
    const cls = classifyRoute(
      params.originLat,
      params.originLng,
      params.destLat,
      params.destLng,
    );
    const inCoverage = cls.routeClass !== 'out_of_coverage';
    // Para precio: urbano = flat; interurbano y corredor aeropuerto = tiers.
    const isIntercity =
      cls.routeClass === 'intercity' || cls.routeClass === 'airport_corridor';
    const weightKg =
      params.weightKg ?? PACKAGE_SIZE_WEIGHT_KG[params.packageSize ?? 'small'];

    const fare = this.calculate({
      serviceType: 'envio',
      distanceKm: cls.distanceKm,
      weightKg,
      isIntercity,
      originCity: cls.originCity ?? undefined,
      destinationCity: cls.destinationCity ?? undefined,
      isOverVolume: params.isOverVolume,
    });

    return {
      price: fare.total,
      currency: fare.currency,
      inCoverage,
      routeClass: cls.routeClass,
      isIntercity,
      originCity: cls.originCity,
      destinationCity: cls.destinationCity,
      weightKg,
      breakdown: fare.breakdown,
    };
  }

  private calcFixed(input: FixedInput): FareBreakdown {
    const r = RATES[input.serviceType];
    const qty = input.quantity ?? 1;
    const subtotal = round(input.baseAmount * qty);
    const platformFee = round(subtotal * r.platformFeePct);
    const providerAmount = round(subtotal - platformFee);
    return {
      subtotal,
      platformFee,
      providerAmount,
      total: subtotal,
      currency: 'USD',
      breakdown: {
        baseAmount: input.baseAmount,
        quantity: qty,
      },
    };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
