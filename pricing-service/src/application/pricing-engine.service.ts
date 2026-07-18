import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Redis from 'ioredis';
import {
  PricingService,
  getPrivateFare,
  getDynamicSurchargeRate,
  getClientSurchargeRate,
  isEcuadorHoliday,
  CARPOOL_SEATING,
  type ClientSegment,
} from 'pricing';
import {
  RateFareList,
  RateFareListDocument,
} from '../infrastructure/schemas/rate-fare-list.schema';
import {
  RateRule,
  RateRuleDocument,
} from '../infrastructure/schemas/rate-rule.schema';
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
  /**
   * Paradas INTERMEDIAS del viaje (no cuenta origen ni destino final).
   * Cada parada suma el recargo definido por la regla `stop_surcharge` del
   * motor — editable en vivo, no hardcodeado.
   */
  stops?: number;
  /** Código de promoción (F4-2) — aplica reglas condition:promo_code vigentes. */
  promoCode?: string;
  /** Conductor (F4-2) — aplica su precio propio (regla flat_override con tope). */
  providerId?: string;
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
const INVALIDATE_CHANNEL = 'pricing:invalidate';

@Injectable()
export class PricingEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PricingEngineService.name);
  private readonly pricing = new PricingService();
  private redisPub?: Redis;
  private redisSub?: Redis;
  // Una lista activa POR servicio (compartido/privado/empresas/urbano).
  private lists: Record<string, RateFareListDocument> = {};
  // Reglas activas (recargos día/hora/feriado/promo) — F4, editables en Atlas.
  private rules: RateRuleDocument[] = [];
  private loadedAt = 0;
  private readonly TTL_MS = 60_000;

  /** Lista activa de un servicio; cae a 'compartido' si no hay una propia. */
  private listFor(service: string): RateFareListDocument | null {
    return this.lists[service] ?? this.lists['compartido'] ?? null;
  }

  constructor(
    @InjectModel(RateFareList.name)
    private readonly listModel: Model<RateFareListDocument>,
    @InjectModel(RateRule.name)
    private readonly ruleModel: Model<RateRuleDocument>,
  ) {}

  async onModuleInit() {
    await this.seedIfEmpty();
    await this.refresh();
    this.setupInvalidation();
  }

  onModuleDestroy() {
    this.redisSub?.disconnect();
    this.redisPub?.disconnect();
  }

  /**
   * F3: invalidación de caché INSTANTÁNEA entre instancias vía Redis pub/sub.
   * Al editar una lista/regla se publica en el canal; TODAS las instancias
   * refrescan al instante (sin esperar el TTL de 60s). Si no hay Redis, el TTL
   * sigue de fallback (degradación gentil).
   */
  private setupInvalidation() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL no configurada — invalidación por TTL (60s) solamente');
      return;
    }
    try {
      this.redisPub = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: false });
      this.redisSub = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: false });
      this.redisPub.on('error', (e) => this.logger.debug(`redis pub: ${e.message}`));
      this.redisSub.on('error', (e) => this.logger.debug(`redis sub: ${e.message}`));
      this.redisSub.subscribe(INVALIDATE_CHANNEL, (err) => {
        if (err) this.logger.warn(`subscribe falló: ${err.message}`);
        else this.logger.log('Suscrito a invalidación de caché (Redis pub/sub)');
      });
      this.redisSub.on('message', (channel) => {
        if (channel === INVALIDATE_CHANNEL) {
          this.logger.log('Invalidación recibida → refrescando listas/reglas');
          this.refresh().catch(() => {});
        }
      });
    } catch (e) {
      this.logger.warn(`setupInvalidation falló: ${(e as Error).message}`);
    }
  }

  /** Publica una invalidación para que TODAS las instancias refresquen ya. */
  publishInvalidate() {
    this.redisPub?.publish(INVALIDATE_CHANNEL, String(Date.now())).catch?.(() => {});
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
      // Reglas activas (F4) — ordenadas por prioridad asc.
      this.rules = await this.ruleModel
        .find({ active: true })
        .sort({ priority: 1 })
        .lean<RateRuleDocument[]>();
      this.loadedAt = Date.now();
      const summary = Object.entries(map)
        .map(([s, d]) => `${s} v${d.version}`)
        .join(', ');
      if (docs.length) this.logger.log(`Listas activas: ${summary} | ${this.rules.length} reglas`);
      else this.logger.warn('No hay rate_fare_list activa en Atlas');
    } catch (e) {
      this.logger.warn(`refresh() falló: ${(e as Error).message}`);
    }
  }

  // ── Evaluador de reglas de recargo (F4) — replica getDynamicSurchargeRate ─────
  private conditionMatches(cond: any, dt: Date): boolean {
    if (!cond) return false;
    switch (cond.type) {
      case 'always':
        return true;
      case 'time_window': {
        const h = dt.getHours();
        const from = cond.fromHour ?? 0;
        const to = cond.toHour ?? 24;
        return from <= to ? h >= from && h < to : h >= from || h < to; // soporta wrap (22→5)
      }
      case 'day_of_week':
        return Array.isArray(cond.days) && cond.days.includes(dt.getDay());
      case 'holiday':
        return isEcuadorHoliday(dt);
      default:
        return false;
    }
  }

  /**
   * Recargo (0–1) desde las reglas de Atlas para un modo/fecha. Suma entre
   * grupos distintos; dentro de un grupo aplica el MAYOR (feriado > finde).
   * Devuelve null si NO hay reglas → el caller usa el fallback de código (paridad).
   */
  private surchargeFromRules(dt: Date, mode: string): number | null {
    if (!this.rules.length) return null;
    const byGroup: Record<string, number> = {};
    let any = false;
    for (const r of this.rules) {
      const modes = (r as any).scope?.modes;
      if (modes && !modes.includes(mode)) continue;
      if ((r as any).effect?.type !== 'surcharge_rate') continue;
      if (!this.conditionMatches((r as any).condition, dt)) continue;
      any = true;
      const g = (r as any).group || (r as any).name;
      const v = Number((r as any).effect.value) || 0;
      byGroup[g] = Math.max(byGroup[g] ?? 0, v);
    }
    if (!any && !this.rules.some((r) => (r as any).effect?.type === 'surcharge_rate')) return null;
    return Object.values(byGroup).reduce((a, b) => a + b, 0);
  }

  /**
   * Recargo FIJO por parada intermedia. Sale de una REGLA del motor
   * (`effect.type = 'stop_surcharge'`, valor en USD por parada), así se edita
   * en vivo sin deploy — igual que los demás recargos. Si no hay regla activa,
   * no cobra nada (nunca inventa un recargo).
   *
   * Si hubiera varias reglas aplicables gana la de mayor valor, mismo criterio
   * que los recargos por tiempo.
   */
  private stopSurcharge(
    input: PriceInput,
    dt: Date,
    mode: string,
  ): { count: number; unit: number; total: number } {
    const count = Math.max(0, Math.floor(Number(input.stops) || 0));
    if (!count) return { count: 0, unit: 0, total: 0 };
    let unit = 0;
    for (const r of this.rules) {
      if ((r as any).effect?.type !== 'stop_surcharge') continue;
      if ((r as any).active === false) continue;
      const modes = (r as any).scope?.modes;
      if (modes && !modes.includes(mode)) continue;
      if (!this.conditionMatches((r as any).condition, dt)) continue;
      unit = Math.max(unit, Number((r as any).effect.value) || 0);
    }
    return { count, unit, total: round(unit * count) };
  }

  /** Recargo dinámico: reglas de Atlas si existen, si no el código (paridad). */
  private surge(dt: Date, mode: string): number {
    const fromRules = this.surchargeFromRules(dt, mode);
    return fromRules != null ? fromRules : getDynamicSurchargeRate(dt, mode as any);
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
    const core = await this.priceCore(input, dt);
    return this.applyPromoProvider(core, input, dt);
  }

  /**
   * Snapshot público de las tablas + reglas activas — para que webapp/móvil
   * coticen del lado del cliente con LOS DATOS DEL MOTOR (no una copia vieja),
   * cerrando la última divergencia de precios en pantallas. Se baja al cargar.
   */
  async snapshot() {
    await this.ensureFresh();
    const l = this.lists;
    const tbl = (svc: string, key: 'shared' | 'privateFares' | 'rates') =>
      l[svc] ? { version: l[svc].version, [key === 'privateFares' ? 'private' : key]: (l[svc] as any)[key] ?? {} } : null;
    return {
      updatedAt: this.loadedAt,
      compartido: tbl('compartido', 'shared'),
      privado: tbl('privado', 'privateFares'),
      empresas: tbl('empresas', 'privateFares'),
      urbano: tbl('urbano', 'rates'),
      // Reglas de recargo (día/hora/feriado) para replicar el surge en el cliente.
      surchargeRules: this.rules
        .filter((r: any) => r.effect?.type === 'surcharge_rate')
        .map((r: any) => ({ name: r.name, group: r.group, scope: r.scope, condition: r.condition, effect: r.effect, active: r.active })),
    };
  }

  /** Cálculo base por servicio (paridad). El promo/precio-por-conductor se
   *  aplica después en applyPromoProvider(). */
  private async priceCore(input: PriceInput, dt: Date): Promise<PriceResult> {
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

        const stopFee = this.stopSurcharge(input, dt, 'privado');

        if (explicit != null) {
          const surge = this.surge(dt, 'privado'); // reglas Atlas (o código); NO segmento
          const total = round(explicit * (1 + surge)) + originSurcharge + stopFee.total;
          const { platformFee, providerAmount } = this.feeSplit(total);
          return {
            total, currency, base: explicit, platformFee, providerAmount,
            listVersion: svcList?.version ?? listVersion,
            breakdown: {
              basePrice: explicit, timeSurchargeRate: surge, originSurcharge,
              stops: stopFee.count,
              stopSurchargeUnit: stopFee.unit,
              stopSurchargeTotal: stopFee.total,
              list: isCorp ? 'empresas' : 'privado',
            },
          };
        }

        // Fallback: deriva de la tabla compartido, pero el surge sale de las
        // REGLAS de Atlas (this.surge) + recargo de segmento. Replica
        // calcIntercityFare pero editable en vivo (antes usaba el código).
        const perSeat = this.sharedFare(input.origin, input.destination);
        if (perSeat == null) throw new Error(`Sin tarifa para ${input.origin}→${input.destination}`);
        const base = getPrivateFare(perSeat, veh);
        const surge = this.surge(dt, 'privado');
        const segRate = getClientSurchargeRate(segment);
        const total = round(base * (1 + surge + segRate)) + originSurcharge + stopFee.total;
        const { platformFee, providerAmount } = this.feeSplit(total);
        return {
          total, currency, base, platformFee, providerAmount, listVersion,
          breakdown: {
            basePrice: base, timeSurchargeRate: surge,
            clientSurchargeRate: segRate, originSurcharge,
            stops: stopFee.count,
            stopSurchargeUnit: stopFee.unit,
            stopSurchargeTotal: stopFee.total,
            list: 'compartido(derivado)',
          },
        };
      }

      // ── Urbano / ride-sharing inmediato — reglas propias (base+km+min + surge) ─
      // Usa los `rates` de la lista 'urbano' si existe (editable en vivo); si no,
      // fallback exacto a calcTransport (RATES del código) = paridad.
      case 'urban_ride': {
        const surge = 1 + this.surge(dt, 'privado');
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

  // ── F4-2: precio por conductor + promociones ──────────────────────────────────
  private ruleRouteMatches(rule: any, input: PriceInput): boolean {
    const s = rule.scope || {};
    const norm = (x?: string) => (x ?? '').toLowerCase();
    if (s.origin && norm(s.origin) !== norm(input.origin)) return false;
    if (s.destination && norm(s.destination) !== norm(input.destination)) return false;
    if (s.serviceTypes && !s.serviceTypes.includes(input.serviceType)) return false;
    if (s.vehicleTypes && input.vehicleType && !s.vehicleTypes.includes(input.vehicleType)) return false;
    return true;
  }

  private withinValidity(rule: any, dt: Date): boolean {
    if (rule.validFrom && dt < new Date(rule.validFrom)) return false;
    if (rule.validTo && dt > new Date(rule.validTo)) return false;
    return true;
  }

  /**
   * Aplica, sobre el precio ya calculado:
   *  1. PRECIO POR CONDUCTOR: si viene `providerId` y hay una regla flat_override
   *     de ese conductor para la ruta → fija su precio, con TOPE ±PROVIDER_CAP.
   *  2. PROMO: si viene `promoCode` y hay reglas promo_code vigentes → descuento.
   */
  private applyPromoProvider(res: PriceResult, input: PriceInput, dt: Date): PriceResult {
    let total = res.total;
    const adjustments: Array<Record<string, unknown>> = [];
    const PROVIDER_CAP = 0.3; // ±30% del precio de plataforma

    if (input.providerId) {
      const rule = this.rules.find(
        (r: any) => r.active !== false && r.scope?.providerId === input.providerId &&
          r.effect?.type === 'flat_override' && this.ruleRouteMatches(r, input) && this.withinValidity(r, dt),
      ) as any;
      if (rule) {
        // Guard: una regla con effect.value ausente/no numérico (entrada de ops)
        // haría Number(...) => NaN y propagaría NaN al precio. Se ignora.
        const v = Number(rule.effect.value);
        if (Number.isFinite(v)) {
          const min = res.total * (1 - PROVIDER_CAP);
          const max = res.total * (1 + PROVIDER_CAP);
          const capped = round(Math.min(max, Math.max(min, v)));
          adjustments.push({ rule: rule.name, type: 'provider_override', providerId: input.providerId, from: total, to: capped });
          total = capped;
        }
      }
    }

    if (input.promoCode) {
      for (const r of this.rules as any[]) {
        if (r.active === false) continue;
        if (r.condition?.type !== 'promo_code' || r.condition.code !== input.promoCode) continue;
        if (!this.withinValidity(r, dt)) continue;
        const e = r.effect || {};
        // Guard: value inválido (ausente/no numérico) => NaN. Se ignora la promo.
        const ev = Number(e.value);
        if (!Number.isFinite(ev)) continue;
        let nt = total;
        if (e.type === 'discount_rate') nt = round(total * (1 - ev));
        else if (e.type === 'multiplier') nt = round(total * ev);
        else if (e.type === 'flat_add') nt = round(total + ev);
        else continue;
        adjustments.push({ rule: r.name, type: 'promo', code: input.promoCode, from: total, to: nt });
        total = Math.max(0, nt);
      }
    }

    if (!adjustments.length) return res;
    const { platformFee, providerAmount } = this.feeSplit(total);
    return {
      ...res, total, platformFee, providerAmount,
      breakdown: { ...res.breakdown, adjustments: JSON.stringify(adjustments) },
    };
  }
}
