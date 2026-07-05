import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PricingService,
  getPrivateFare,
  getDynamicSurchargeRate,
  CARPOOL_SEATING,
  type ClientSegment,
} from 'pricing';
import {
  RateFareList,
  RateFareListDocument,
} from '../infrastructure/schemas/rate-fare-list.schema';
// Snapshot inicial (paridad con libs/pricing FARES). Se siembra en Atlas solo si
// la colección está vacía (primer deploy); luego manda lo que haya en Atlas.
import fareSeed from '../seed/fare-list.json';

// ── Contrato del endpoint ─────────────────────────────────────────────────────
export type PriceServiceType =
  | 'shared_seat'
  | 'intercity_private'
  | 'urban_ride'
  | 'airport'
  | 'envio';

export interface PriceInput {
  serviceType: PriceServiceType;
  origin?: string;
  destination?: string;
  vehicleType?: string;
  dateTime?: string;
  segment?: ClientSegment;
  seats?: number;
  frontExclusive?: boolean;
  originSurcharge?: number;
  distanceKm?: number;
  durationMinutes?: number;
  weightKg?: number;
  packageSize?: 'small' | 'medium' | 'large';
  isOverVolume?: boolean;
}

export interface PriceResult {
  total: number;
  currency: string;
  base: number;
  platformFee: number;
  providerAmount: number;
  listVersion: number | null;
  breakdown: Record<string, number | string>;
}

const PLATFORM_FEE_SHARED = 0.2; // RATES.shared.platformFeePct — paridad
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * PricingEngineService — el motor de tarifas.
 *
 * F1: la FÓRMULA se reutiliza tal cual de `libs/pricing` (paridad garantizada);
 * la TABLA de tarifas se lee de Atlas (rate_fare_lists activa, con caché) → una
 * tarifa se cambia en un solo lugar, sin deploy. Las reglas (día/hora/feriado)
 * siguen viniendo del código de libs/pricing en F1 (migran a Atlas en F4).
 */
@Injectable()
export class PricingEngineService implements OnModuleInit {
  private readonly logger = new Logger(PricingEngineService.name);
  private readonly pricing = new PricingService();
  private activeList: RateFareListDocument | null = null;
  private loadedAt = 0;
  private readonly TTL_MS = 60_000;

  constructor(
    @InjectModel(RateFareList.name)
    private readonly listModel: Model<RateFareListDocument>,
  ) {}

  async onModuleInit() {
    await this.seedIfEmpty();
    await this.refresh();
  }

  /** Bootstrap: si no hay ninguna lista, siembra el snapshot inicial (paridad). */
  private async seedIfEmpty(): Promise<void> {
    try {
      const count = await this.listModel.estimatedDocumentCount();
      if (count > 0) return;
      await this.listModel.create({
        ...(fareSeed as Record<string, unknown>),
        importedAt: new Date(),
        createdBy: 'bootstrap',
      });
      this.logger.log(
        `Bootstrap: sembrada lista inicial (${Object.keys((fareSeed as any).shared ?? {}).length} pares)`,
      );
    } catch (e) {
      this.logger.warn(`seedIfEmpty() falló: ${(e as Error).message}`);
    }
  }

  /** Recarga la lista activa desde Atlas. Llamable por el panel (invalidación). */
  async refresh(): Promise<void> {
    try {
      const doc = await this.listModel
        .findOne({ active: true })
        .sort({ version: -1 })
        .lean<RateFareListDocument>();
      if (doc) {
        this.activeList = doc;
        this.loadedAt = Date.now();
        this.logger.log(
          `Lista activa: "${doc.name}" v${doc.version} — ${Object.keys(doc.shared ?? {}).length} pares`,
        );
      } else {
        this.logger.warn('No hay rate_fare_list activa en Atlas (¿corriste el import?)');
      }
    } catch (e) {
      this.logger.warn(`refresh() falló: ${(e as Error).message}`);
    }
  }

  private async ensureFresh() {
    if (!this.activeList || Date.now() - this.loadedAt > this.TTL_MS) {
      await this.refresh();
    }
  }

  private fareKey(o: string, d: string) {
    return `${o}-${d}`.toLowerCase();
  }

  /** Tarifa por asiento compartido desde la lista activa (en cualquier sentido). */
  private sharedFare(o?: string, d?: string): number | null {
    if (!o || !d) return null;
    const s = this.activeList?.shared ?? {};
    return s[this.fareKey(o, d)] ?? s[this.fareKey(d, o)] ?? null;
  }

  private feeSplit(total: number, pct = PLATFORM_FEE_SHARED) {
    const platformFee = round(total * pct);
    return { platformFee, providerAmount: round(total - platformFee) };
  }

  async price(input: PriceInput): Promise<PriceResult> {
    await this.ensureFresh();
    const dt = input.dateTime ? new Date(input.dateTime) : new Date();
    const segment = (input.segment ?? 'public') as ClientSegment;
    const listVersion = this.activeList?.version ?? null;
    const currency = 'USD';

    switch (input.serviceType) {
      // ── Compartido programado (paridad: PricingService.calcCarpoolSeats) ──────
      case 'shared_seat': {
        const perSeat = this.sharedFare(input.origin, input.destination);
        if (perSeat == null) throw new Error(`Sin tarifa para ${input.origin}→${input.destination}`);
        const seats = input.seats ?? 1;
        const veh = (input.vehicleType ?? 'suv') as 'suv' | 'suv_xl';
        const seating = CARPOOL_SEATING[veh];
        const frontSurcharge = input.frontExclusive ? seating?.frontSeatSurcharge ?? 0 : 0;
        const seatsSubtotal = round(perSeat * seats);
        const total = round(seatsSubtotal + frontSurcharge);
        const { platformFee, providerAmount } = this.feeSplit(total);
        return {
          total, currency, base: seatsSubtotal, platformFee, providerAmount, listVersion,
          breakdown: { perSeat, seats, seatsSubtotal, frontSurcharge },
        };
      }

      // ── Privado interurbano inmediato (paridad: calcIntercityFare) ────────────
      case 'intercity_private': {
        const perSeat = this.sharedFare(input.origin, input.destination);
        if (perSeat == null) throw new Error(`Sin tarifa para ${input.origin}→${input.destination}`);
        const veh = (input.vehicleType ?? 'suv') as any;
        const base = getPrivateFare(perSeat, veh);
        const r = this.pricing.calcIntercityFare({
          basePrice: base,
          mode: 'privado',
          serviceDateTime: dt,
          clientSegment: segment,
          originSurcharge: input.originSurcharge ?? 0,
        });
        return {
          total: r.total, currency, base, platformFee: r.platformFee,
          providerAmount: r.providerAmount, listVersion,
          breakdown: {
            basePrice: base,
            timeSurchargeRate: r.timeSurchargeRate,
            clientSurchargeRate: r.clientSurchargeRate,
            originSurcharge: r.originSurcharge,
          },
        };
      }

      // ── Urbano on-demand (paridad: calcTransport con surge dinámico) ──────────
      case 'urban_ride': {
        const surge = 1 + getDynamicSurchargeRate(dt, 'privado');
        const r = this.pricing.calculate({
          serviceType: 'transport',
          distanceKm: input.distanceKm ?? 0,
          durationMinutes: input.durationMinutes ?? 0,
          surgeMultiplier: surge,
        });
        return {
          total: r.total, currency, base: r.subtotal, platformFee: r.platformFee,
          providerAmount: r.providerAmount, listVersion,
          breakdown: { ...r.breakdown },
        };
      }

      // ── Aeropuerto (paridad: tarifa fija por asiento desde la tabla) ──────────
      case 'airport': {
        const perSeat = this.sharedFare(input.origin, input.destination);
        if (perSeat == null) throw new Error(`Sin tarifa de aeropuerto para ${input.origin}→${input.destination}`);
        const { platformFee, providerAmount } = this.feeSplit(perSeat);
        return {
          total: perSeat, currency, base: perSeat, platformFee, providerAmount, listVersion,
          breakdown: { tarifaFija: perSeat },
        };
      }

      // ── Envío (paridad: PricingService.calcEnvio vía calculate) ───────────────
      case 'envio': {
        const isIntercity = !!input.origin && !!input.destination && input.origin !== input.destination;
        const weightKg = input.weightKg ?? { small: 5, medium: 15, large: 30 }[input.packageSize ?? 'small'];
        const r = this.pricing.calculate({
          serviceType: 'envio',
          distanceKm: input.distanceKm ?? 0,
          weightKg,
          isIntercity,
          originCity: input.origin,
          destinationCity: input.destination,
          isOverVolume: input.isOverVolume,
        } as any);
        return {
          total: r.total, currency, base: r.subtotal, platformFee: r.platformFee,
          providerAmount: r.providerAmount, listVersion,
          breakdown: { ...r.breakdown },
        };
      }

      default:
        throw new Error(`serviceType no soportado: ${input.serviceType}`);
    }
  }
}
