import { Injectable } from '@nestjs/common';

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
    const distanceCost = input.distanceKm * r.perKm;
    const weightCost = input.weightKg * r.perKg;
    const subtotal = round(r.baseFare + distanceCost + weightCost);
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
        weightCost: round(weightCost),
      },
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
