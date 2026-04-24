import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GeoPoint,
  IRoutingProvider,
} from '@going-monorepo-clean/shared-infrastructure';
import {
  PricingService,
  ClientSegment,
  RideMode,
  applyDynamicPricing,
} from './pricing.service';

/**
 * FareEngine — motor de precios unificado.
 *
 * Orquesta:
 *   1. Distancia real por carretera (OSRM vía IRoutingProvider).
 *   2. Tarifa base $0.50/km (configurable por serviceType).
 *   3. Recargo +25% para Tipo A (agencies/corporate) — ya implementado
 *      por PricingService.getClientSurchargeRate.
 *   4. Surge dinámico por hora/día/feriado (PricingService existente).
 *   5. Descuento por puntos (Tipo B): 100 puntos = 1 USD, tope 50%.
 *
 * NO persiste nada: se le pasan puntos disponibles y retorna cuántos
 * se consumieron. El caller se encarga de decrementar/acreditar en el
 * user record via LoyaltyPointsService.
 */

export type ServiceCategory = 'transport' | 'envio';

export interface FareQuoteInput {
  origin: GeoPoint;
  destination: GeoPoint;
  category: ServiceCategory;
  /** 'privado' | 'compartido' — afecta recargo dinámico. */
  mode?: RideMode;
  /** Derivado del JWT: corporate/agency → A, resto → B. */
  clientSegment: ClientSegment;
  /** Fecha/hora del servicio (para surge). Default: ahora. */
  serviceDateTime?: Date;
  /** Peso del paquete — sólo para category='envio'. */
  weightKg?: number;
  /** Puntos que el usuario desea canjear. Ignorado si clientSegment != 'public'. */
  redeemPoints?: number;
  /** Saldo disponible del usuario — validación. */
  availablePoints?: number;
}

export interface FareQuote {
  distanceKm: number;
  durationMinutes: number;
  routingProvider: string;
  routingFallback: boolean;

  // Desglose de precios
  baseFare: number;          // componente fijo (base)
  distanceCost: number;      // $/km × km
  durationCost: number;      // $/min × min (sólo transport)
  weightCost?: number;       // $/kg × kg (sólo envio)
  subtotal: number;          // base + distance + duration [+ weight]

  // Ajustes
  timeSurchargeRate: number; // 0–1
  clientSurchargeRate: number; // 0–1
  surgeMultiplier: number;   // factor opcional adicional
  surcharges: number;        // monto absoluto sumado por recargos

  // Descuento por puntos
  pointsRedeemed: number;    // puntos realmente consumidos
  pointsDiscount: number;    // USD descontados
  pointsMaxDiscount: number; // tope 50% del subtotal+recargos

  // Totales
  total: number;             // lo que paga el usuario
  platformFee: number;       // comisión Going
  providerAmount: number;    // lo que recibe el conductor
  currency: 'USD';

  // Recompensa para el siguiente viaje (sólo Tipo B)
  pointsEarned: number;

  // Para auditar cómo se llegó al precio
  explain: Record<string, number | string | boolean>;
}

const PTS_PER_USD = 100; // 100 puntos = 1 USD
const POINTS_MAX_DISCOUNT_FRACTION = 0.5; // 50% tope

/**
 * RATES — alineados con la propuesta del motor:
 *   - transport: $0.50/km (tu spec)
 *   - envio:     $0.50/km (mismo formula, + peso)
 *   - shared:    $0.35/km (mantenemos discount para carpooling)
 *
 * Los perMinute y baseFare permanecen del PricingService original
 * para no romper los tests que dependen del desglose.
 */
const FARE_RATES = {
  transport: {
    baseFare: 2.5,
    perKm: 0.5,       // ← ajustado a spec del motor
    perMinute: 0.1,
    platformFeePct: 0.2,
  },
  envio: {
    baseFare: 3.0,
    perKm: 0.5,       // ← ajustado a spec del motor
    perKg: 0.5,
    platformFeePct: 0.18,
  },
} as const;

@Injectable()
export class FareEngine {
  private readonly logger = new Logger(FareEngine.name);

  constructor(
    @Inject(IRoutingProvider)
    private readonly routingProvider: IRoutingProvider,
    private readonly pricingService: PricingService,
  ) {}

  async quote(input: FareQuoteInput): Promise<FareQuote> {
    // 1. Distancia real por carretera.
    const route = await this.routingProvider.route(input.origin, input.destination);

    // 2. Componentes base.
    const rates =
      input.category === 'envio' ? FARE_RATES.envio : FARE_RATES.transport;
    const baseFare = rates.baseFare;
    const distanceCost = round(route.distanceKm * rates.perKm);
    const durationCost =
      input.category === 'transport'
        ? round(route.durationMinutes * (rates as typeof FARE_RATES.transport).perMinute)
        : 0;
    const weightCost =
      input.category === 'envio' && input.weightKg != null
        ? round(input.weightKg * (rates as typeof FARE_RATES.envio).perKg)
        : 0;

    const subtotal = round(baseFare + distanceCost + durationCost + weightCost);

    // 3. Recargos dinámicos (hora/día/feriado) + tipo de cliente (+25% A).
    const serviceDateTime = input.serviceDateTime ?? new Date();
    const mode: RideMode = input.mode ?? 'privado';

    // Reutilizamos la función exportada del módulo pricing (surcharges
    // dinámicos por hora/día/feriado + recargo por segmento Tipo A).
    const applied = applyDynamicPricing({
      basePrice: subtotal,
      mode,
      dateTime: serviceDateTime,
      clientSegment: input.clientSegment,
      originSurcharge: 0,
    });

    // surgeMultiplier opcional (1.0 por default — otras capas pueden ajustar).
    const surgeMultiplier = 1.0;
    const surcharges = round(applied.adjustedPrice - subtotal);

    const priceBeforePoints = round(applied.adjustedPrice * surgeMultiplier);

    // 4. Descuento por puntos (sólo Tipo B = public).
    const pointsMaxDiscount = round(priceBeforePoints * POINTS_MAX_DISCOUNT_FRACTION);
    let pointsRedeemed = 0;
    let pointsDiscount = 0;

    const eligibleForPoints = input.clientSegment === 'public';
    const wantsRedeem =
      (input.redeemPoints ?? 0) > 0 &&
      (input.availablePoints ?? 0) > 0 &&
      eligibleForPoints;

    if (wantsRedeem) {
      const requested = Math.min(
        input.redeemPoints!,
        input.availablePoints!,
      );
      // 100 puntos = $1
      const possibleDiscountUsd = requested / PTS_PER_USD;
      pointsDiscount = round(
        Math.min(possibleDiscountUsd, pointsMaxDiscount),
      );
      pointsRedeemed = Math.round(pointsDiscount * PTS_PER_USD);
    }

    const total = Math.max(0, round(priceBeforePoints - pointsDiscount));

    // 5. Comisión plataforma.
    const platformFeePct = rates.platformFeePct;
    const platformFee = round(total * platformFeePct);
    const providerAmount = round(total - platformFee);

    // 6. Puntos ganados (sobre el monto EFECTIVAMENTE pagado, sólo Tipo B).
    const pointsEarned = eligibleForPoints ? Math.floor(total) : 0;

    return {
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      routingProvider: route.provider,
      routingFallback: route.fallback ?? false,

      baseFare,
      distanceCost,
      durationCost,
      weightCost: weightCost || undefined,
      subtotal,

      timeSurchargeRate: applied.timeSurchargeRate,
      clientSurchargeRate: applied.clientSurchargeRate,
      surgeMultiplier,
      surcharges,

      pointsRedeemed,
      pointsDiscount,
      pointsMaxDiscount,

      total,
      platformFee,
      providerAmount,
      currency: 'USD',

      pointsEarned,

      explain: {
        formula: 'total = (base + km*rate + min*rate [+ kg*rate]) * (1 + timeSurcharge + clientSurcharge) * surge - pointsDiscount',
        perKm: rates.perKm,
        perMinute: 'perMinute' in rates ? rates.perMinute : 0,
        perKg: 'perKg' in rates ? rates.perKg : 0,
        clientSegment: input.clientSegment,
        routingFallback: route.fallback ?? false,
      },
    };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
