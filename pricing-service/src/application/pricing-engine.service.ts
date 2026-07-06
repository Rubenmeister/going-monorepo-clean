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
  // Una lista activa POR servicio (compartido/privado/empresas/urbano).
  private lists: Record<string, RateFareListDocument> = {};
  private loadedAt = 0;
  private readonly TTL_MS = 60_000;

  /** Lista activa de un servicio; cae a 'compartido' si no hay una propia. */
  private listFor(service: string): RateFareListDocument | null {
    return this.lists[service] ?? this.lists['compartido'] ?? null;
  }

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

  /** Recarga TODAS las listas activas (una por servicio) desde Atlas. */
  async refresh(): Promise<void> {
    try {
      const docs = await this.listModel
        .find({ active: true })
        .sort({ version: -1 })
        .lean<RateFareListDocument[]>();
      const map: Record<string, RateFareListDocument> = {};
      for (const d of docs) {
        const svc = (d as any).service || 'compartido';
        if (!map[svc]) map[svc] = d; // la de mayor versión gana (sort desc)
      }
      this.lists = map;
      this.loadedAt = Date.now();
      const summary = Object.entries(map)
        .map(([s, d]) => `${s} v${d.version}`)
        .join(', ');
      if (docs.length) this.logger.log(`Listas activas: ${summary}`);
      else this.logger.warn('No hay rate_fare_list activa en Atlas');
    } catch (e) {
      this.logger.warn(`refresh() falló: ${(e as Error).message}`);
    }
  }

  private async ensureFresh() {
    if (!Object.keys(this.lists).length || Date.now() - this.loadedAt > this.TTL_MS) {
      await this.refresh();
    }
  }

  private fareKey(o: string, d: string) {
    return `${o}-${d}`.toLowerCase();
  }

  /** Tarifa por asiento de la lista COMPARTIDO activa (en cualquier sentido). */
  private sharedFare(o?: string, d?: string): number | null {
    if (!o || !d) return null;
    const s = this.listFor('compartido')?.shared ?? {};
    return s[this.fareKey(o, d)] ?? s[this.fareKey(d, o)] ?? null;
  }

  /** Precio privado explícito (por vehículo) de una lista de servicio, o null. */
  private privateFare(list: RateFareListDocument | null, o?: string, d?: string, veh = 'suv'): number | null {
    if (!list || !o || !d) return null;
    const pf = (list as any).privateFares ?? {};
    const row = pf[this.fareKey(o, d)] ?? pf[this.fareKey(d, o)];
    return row?.[veh] ?? row?.suv ?? null;
  }

  private feeSplit(total: number, pct = PLATFORM_FEE_SHARED) {
    const platformFee = round(total * pct);
    return { platformFee, providerAmount: round(total - platformFee) };
  }

  async price(input: PriceInput): Promise<PriceResult> {
    await this.ensureFresh();
    const dt = input.dateTime ? new Date(input.dateTime) : new Date();
    const segment = (input.segment ?? 'public') as ClientSegment;
    const listVersion = this.listFor('compartido')?.version ?? null;
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

      // ── Privado interurbano inmediato ────────────────────────────────────────
      // Elige la lista por segmento: corporativo/agencia → 'empresas', si no → 'privado'.
      // Si la lista tiene precio explícito por vehículo → lo usa (la lista YA encodea el
      // segmento, así que solo aplica surge de tiempo). Si NO → fallback EXACTO a la
      // fórmula de libs/pricing (calcIntercityFare) para conservar paridad.
      case 'intercity_private': {
        const veh = (input.vehicleType ?? 'suv') as any;
        const isCorp = segment === 'corporate' || segment === 'agency';
        const svcList = this.listFor(isCorp ? 'empresas' : 'privado');
        const explicit = this.privateFare(svcList, input.origin, input.destination, veh);
        const originSurcharge = input.originSurcharge ?? 0;

        if (explicit != null) {
          const surge = getDynamicSurchargeRate(dt, 'privado'); // tiempo/día, NO segmento
          const total = round(explicit * (1 + surge)) + originSurcharge;
          const { platformFee, providerAmount } = this.feeSplit(total);
          return {
            total, currency, base: explicit, platformFee, providerAmount,
            listVersion: svcList?.version ?? listVersion,
            breakdown: { basePrice: explicit, timeSurchargeRate: surge, originSurcharge, list: isCorp ? 'empresas' : 'privado' },
          };
        }

        // Fallback paridad: deriva de la tabla compartido + fórmula de segmento.
        const perSeat = this.sharedFare(input.origin, input.destination);
        if (perSeat == null) throw new Error(`Sin tarifa para ${input.origin}→${input.destination}`);
        const base = getPrivateFare(perSeat, veh);
        const r = this.pricing.calcIntercityFare({
          basePrice: base, mode: 'privado', serviceDateTime: dt,
          clientSegment: segment, originSurcharge,
        });
        return {
          total: r.total, currency, base, platformFee: r.platformFee,
          providerAmount: r.providerAmount, listVersion,
          breakdown: {
            basePrice: base, timeSurchargeRate: r.timeSurchargeRate,
            clientSurchargeRate: r.clientSurchargeRate, originSurcharge: r.originSurcharge, list: 'compartido(derivado)',
          },
        };
      }

      // ── Urbano / ride-sharing inmediato — reglas propias (base+km+min + surge) ─
      // Usa los `rates` de la lista 'urbano' si existe (editable en vivo); si no,
      // fallback exacto a calcTransport (RATES del código) = paridad.
      case 'urban_ride': {
        const surge = 1 + getDynamicSurchargeRate(dt, 'privado');
        const rt = (this.listFor('urbano') as any)?.rates?.transport;
        if (rt && typeof rt.baseFare === 'number') {
          const km = input.distanceKm ?? 0;
          const min = input.durationMinutes ?? 0;
          const total = round((rt.baseFare + km * rt.perKm + min * rt.perMinute) * surge);
          const { platformFee, providerAmount } = this.feeSplit(total, rt.platformFeePct ?? PLATFORM_FEE_SHARED);
          return {
            total, currency, base: total, platformFee, providerAmount,
            listVersion: this.listFor('urbano')?.version ?? listVersion,
            breakdown: { baseFare: rt.baseFare, perKm: rt.perKm, perMinute: rt.perMinute, surgeMultiplier: surge },
          };
        }
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
