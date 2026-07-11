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
  getClientSurchargeRate,
  classifyRoute,
  getExcelFare,
  getExcelPrivatePrices,
  type PrivatePrices,
} from './pricing.service';
import { PricingClient } from '../infrastructure/pricing-client';

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
  /**
   * Vehículo para el precio PRIVADO intercity (suv | suv_xl | van | van_xl |
   * minibus | bus | bus_40). Si falta, se asume 'suv'. En compartido se ignora.
   */
  vehicleType?: keyof PrivatePrices;
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
 * Transport rates — sigue spec original:
 *   - $0.50/km + $0.10/min + $2.5 base
 *
 * Envíos rates — modelo nuevo: precio FIJO por tier de peso.
 * Servicio puerta-a-puerta same-day; el costo no depende de
 * distancia/duración (eso se absorbe en el precio fijo del tier).
 *
 *   Tier A:  0–10 kg → $10 USD
 *   Tier B:  10–20 kg → $15 USD
 *   > 20 kg → rechazado (error 422 — cotización manual)
 *
 * Sobre cuesta lo mismo que paquete pequeño (ambos en Tier A).
 */
const FARE_RATES = {
  transport: {
    baseFare: 2.5,
    perKm: 0.5,
    perMinute: 0.1,
    platformFeePct: 0.2,
  },
  envio: {
    platformFeePct: 0.2,
  },
} as const;

/**
 * Devuelve precio fijo en USD según el peso. Tira si excede 20kg.
 */
function envioFixedPriceByWeight(weightKg: number): number {
  if (weightKg < 0) {
    throw new Error('weightKg no puede ser negativo');
  }
  if (weightKg > 20) {
    throw new Error(
      'weightKg excede el límite de 20 kg — solicita cotización manual',
    );
  }
  return weightKg <= 10 ? 10 : 15;
}

@Injectable()
export class FareEngine {
  private readonly logger = new Logger(FareEngine.name);

  constructor(
    @Inject(IRoutingProvider)
    private readonly routingProvider: IRoutingProvider,
    private readonly pricingService: PricingService,
    private readonly pricingClient: PricingClient,
  ) {}

  async quote(input: FareQuoteInput): Promise<FareQuote> {
    // 1. Distancia real por carretera (informativa para envíos, base de
    //    cálculo para transport).
    const route = await this.routingProvider.route(input.origin, input.destination);

    // 2. Componentes base — calculamos según categoría.
    let baseFare = 0;
    let distanceCost = 0;
    let durationCost = 0;
    let weightCost = 0;
    let subtotal = 0;

    const serviceDateTime = input.serviceDateTime ?? new Date();
    const mode: RideMode = input.mode ?? 'privado';

    // ¿Transporte INTERCITY cubierto por el Excel? → precio FIJO de mercado
    // (compartido o privado por vehículo), SIN taxímetro ni surge.
    let intercityFixedBase: number | null = null;
    let intercityRoute = '';

    if (input.category === 'envio') {
      // Envíos: precio FIJO por tier de peso. Distancia/duración no
      // afectan el precio (es servicio same-day puerta a puerta).
      const weightKg = input.weightKg ?? 0;
      const fixedPrice = envioFixedPriceByWeight(weightKg);
      weightCost = fixedPrice;
      subtotal = fixedPrice;
    } else {
      const cls = classifyRoute(
        input.origin.lat, input.origin.lng,
        input.destination.lat, input.destination.lng,
      );
      if (
        cls.originCity && cls.destinationCity &&
        (cls.routeClass === 'intercity' || cls.routeClass === 'airport_corridor')
      ) {
        if (mode === 'compartido') {
          // F2b: tarifa por asiento del motor (editable en vivo, misma que
          // transport) con fallback al Excel local.
          intercityFixedBase = await this.pricingClient.sharedFare(
            cls.originCity, cls.destinationCity,
            () => getExcelFare(cls.originCity, cls.destinationCity),
          );
        } else {
          // Privado: precio del vehículo pedido (default SUV si no se especifica).
          const veh = (input.vehicleType ?? 'suv') as keyof PrivatePrices;
          const pv = getExcelPrivatePrices(cls.originCity, cls.destinationCity);
          intercityFixedBase = pv ? (pv[veh] ?? pv.suv) : null;
        }
        if (intercityFixedBase != null) {
          intercityRoute = `${cls.originCity}->${cls.destinationCity}`;
        }
      }

      if (intercityFixedBase != null) {
        subtotal = intercityFixedBase; // precio fijo del Excel — sin base/km/min
      } else {
        // Urbano / fuera de cobertura: taxímetro (base + km + min).
        const rates = FARE_RATES.transport;
        baseFare = rates.baseFare;
        distanceCost = round(route.distanceKm * rates.perKm);
        durationCost = round(route.durationMinutes * rates.perMinute);
        subtotal = round(baseFare + distanceCost + durationCost);
      }
    }

    // 3. Recargos.
    let timeSurchargeRate = 0;
    let clientSurchargeRate = 0;
    let priceBeforePoints = 0;
    // surgeMultiplier opcional (1.0 por default — otras capas pueden ajustar).
    const surgeMultiplier = 1.0;

    if (intercityFixedBase != null) {
      // INTERCITY: precio FIJO del Excel, SIN surge hora/día/feriado.
      // Único recargo que aplica: segmento de cliente (+25% agencia/corporativo).
      clientSurchargeRate = getClientSurchargeRate(input.clientSegment);
      priceBeforePoints = round(subtotal * (1 + clientSurchargeRate));
    } else {
      // Envío / urbano: recargos dinámicos (hora/día/feriado) + tipo de cliente.
      const applied = applyDynamicPricing({
        basePrice: subtotal,
        mode,
        dateTime: serviceDateTime,
        clientSegment: input.clientSegment,
        originSurcharge: 0,
      });
      timeSurchargeRate = applied.timeSurchargeRate;
      clientSurchargeRate = applied.clientSurchargeRate;
      priceBeforePoints = round(applied.adjustedPrice * surgeMultiplier);
    }

    const surcharges = round(priceBeforePoints - subtotal);

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
    const platformFeePct =
      input.category === 'envio'
        ? FARE_RATES.envio.platformFeePct
        : FARE_RATES.transport.platformFeePct;
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

      timeSurchargeRate,
      clientSurchargeRate,
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
        formula:
          input.category === 'envio'
            ? 'total = fixedTier(weightKg) * (1 + timeSurcharge + clientSurcharge) * surge - pointsDiscount'
            : 'total = (base + km*rate + min*rate) * (1 + timeSurcharge + clientSurcharge) * surge - pointsDiscount',
        pricingMode:
          intercityFixedBase != null
            ? 'excel_fixed_intercity'
            : input.category === 'envio'
              ? 'envio_fixed'
              : 'meter_urban',
        intercityRoute: intercityRoute || 'n/a',
        perKm: input.category === 'envio' ? 0 : FARE_RATES.transport.perKm,
        perMinute: input.category === 'envio' ? 0 : FARE_RATES.transport.perMinute,
        envioTier:
          input.category === 'envio'
            ? (input.weightKg ?? 0) <= 10
              ? 'A (0-10kg, $10)'
              : 'B (10-20kg, $15)'
            : 'n/a',
        clientSegment: input.clientSegment,
        routingFallback: route.fallback ?? false,
      },
    };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
