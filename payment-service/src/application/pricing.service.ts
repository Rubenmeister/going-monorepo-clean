import { Injectable } from '@nestjs/common';

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

type PricingInput = TransportInput | EnvioInput | FixedInput;

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
      case 'envio':
        return this.calcEnvio(input as EnvioInput);
      case 'accommodation':
      case 'tour':
      case 'experience':
        return this.calcFixed(input as FixedInput);
    }
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
