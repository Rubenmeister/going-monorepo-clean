/**
 * RecurringTripExpanderService — cron diario que materializa los viajes
 * recurrentes corporativos como bookings concretos.
 *
 * Estrategia:
 *   - Corre @Cron(EVERY_DAY_AT_2AM) — fuera del horario del BookingDispatcher
 *     (que va cada 5 min) para no chocar carga.
 *   - Para cada RecurringTrip activo, genera fechas concretas en el rango
 *     (lastExpanded, now + EXPANSION_HORIZON_DAYS] que matchean el schedule
 *     (daily / weekly weekDays / monthly dayOfMonth).
 *   - Para cada fecha, crea un Booking con status='pending', `companyId`,
 *     `clientSegment='corporate'`, `paymentMode='corporate_monthly'`. El
 *     BookingDispatcher se encarga después de dispararlo como ride real.
 *   - Sella el RecurringTrip con `expandedUntil = horizonEnd` para
 *     idempotencia: el próximo tick solo genera lo que falta.
 *
 * Idempotencia primaria: `expandedUntil` por recurrente. Si el cron crashea
 * a mitad de un tick, el siguiente reanuda desde donde quedó.
 *
 * Defaults:
 *   EXPANSION_HORIZON_DAYS = 30 (configurable vía env)
 *   serviceId placeholder = el id del recurrente (los rides reales no
 *   consumen el `Trip` aún — el BookingDispatcher hoy envía coords 0,0 y
 *   resuelve más adelante, ver booking-dispatcher.service.ts:147-150).
 *
 * Toggle: env `RECURRING_TRIP_EXPANDER_ENABLED` (default true).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Booking,
  IBookingRepository,
} from '@going-monorepo-clean/domains-booking-core';
import { Money } from '@going-monorepo-clean/shared-domain';
import { RecurringTripRepository } from '../infrastructure/recurring-trip.repository';
import type {
  RecurringTripModelSchema,
  RecurringTripFrequency,
} from '../infrastructure/persistence/schemas/recurring-trip.schema';

@Injectable()
export class RecurringTripExpanderService {
  private readonly logger = new Logger(RecurringTripExpanderService.name);
  private readonly horizonDays: number;
  private readonly enabled: boolean;

  constructor(
    private readonly recurringRepo: RecurringTripRepository,
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
    private readonly config: ConfigService,
  ) {
    this.horizonDays = parseInt(
      this.config.get<string>('RECURRING_TRIP_HORIZON_DAYS') ?? '30',
      10,
    );
    this.enabled =
      this.config.get<string>('RECURRING_TRIP_EXPANDER_ENABLED') !== 'false';
    if (this.enabled) {
      this.logger.log(
        `[recurring-expander] activo (horizon=${this.horizonDays} días)`,
      );
    } else {
      this.logger.warn(
        '[recurring-expander] RECURRING_TRIP_EXPANDER_ENABLED=false → cron desactivado',
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM, { name: 'recurring-trip-expander' })
  async expand(): Promise<void> {
    if (!this.enabled) return;
    const now = new Date();
    const horizonEnd = new Date(now.getTime() + this.horizonDays * 86_400_000);

    const recurrents = await this.recurringRepo.findActiveForExpansion();
    if (recurrents.length === 0) {
      this.logger.debug('[recurring-expander] tick: 0 recurrentes activos');
      return;
    }
    this.logger.log(
      `[recurring-expander] tick: ${recurrents.length} recurrentes activos`,
    );

    let totalGenerated = 0;
    let failed = 0;

    for (const r of recurrents) {
      try {
        const generated = await this.expandOne(r, now, horizonEnd);
        totalGenerated += generated;
      } catch (e) {
        failed++;
        this.logger.error(
          `[recurring-expander] ${r.id} (${r.name}) fallo: ${
            (e as Error).message
          }`,
        );
      }
    }

    this.logger.log(
      `[recurring-expander] tick done: ${totalGenerated} bookings generados, ${failed} fallos`,
    );
  }

  /**
   * Expande un recurrente: calcula fechas pendientes y crea bookings.
   * Retorna # de bookings creados.
   */
  private async expandOne(
    r: RecurringTripModelSchema,
    now: Date,
    horizonEnd: Date,
  ): Promise<number> {
    // Punto de partida: nunca antes que `now`, ni antes que el último expandedUntil.
    const start = r.expandedUntil && r.expandedUntil > now ? r.expandedUntil : now;
    const dates = enumerateDates(r.frequency, r.weekDays, r.dayOfMonth, r.time, start, horizonEnd);

    if (dates.length === 0) {
      // Igual sellamos `expandedUntil` para que el próximo tick no
      // re-escanee. Esto pasa con un weekly de pocos días o monthly futuro.
      await this.recurringRepo.updateExpansionState(r.id, horizonEnd);
      return 0;
    }

    // Placeholder money: 1 centavo. El BookingDispatcher recotiza el precio
    // real cuando dispara el ride. Money.create exige amount > 0 e integer.
    const placeholderMoney = Money.create(1, 'USD');
    if (placeholderMoney.isErr()) {
      throw new Error(
        `Money placeholder fallo (no debería): ${placeholderMoney.error.message}`,
      );
    }

    let created = 0;
    for (const startDate of dates) {
      const bookingResult = Booking.create({
        userId: r.userId,
        serviceId: r.id, // placeholder: el recurrente actúa como serviceId
        serviceType: r.serviceType,
        totalPrice: placeholderMoney.value,
        startDate,
        companyId: r.companyId,
        clientSegment: 'corporate',
        paymentMode: 'corporate_monthly',
      });

      if (bookingResult.isErr()) {
        this.logger.warn(
          `[recurring-expander] ${r.id} fecha ${startDate.toISOString()} skipped: ${
            bookingResult.error.message
          }`,
        );
        continue;
      }
      // Idempotencia por ocurrencia (auditoría B1 #12): clave natural
      // recurringId:fecha. Si ya se expandió esa ocurrencia (re-run tras crash,
      // o dos pods a la vez), saveExpanded devuelve false y no duplica.
      const recurrenceKey = `${r.id}:${startDate.toISOString()}`;
      const saveResult = await this.bookingRepo.saveExpanded(
        bookingResult.value,
        recurrenceKey,
      );
      if (saveResult.isErr()) {
        this.logger.warn(
          `[recurring-expander] ${r.id} save fallo: ${saveResult.error.message}`,
        );
        continue;
      }
      if (saveResult.value) created++;
    }

    await this.recurringRepo.updateExpansionState(r.id, horizonEnd);
    return created;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Genera todas las fechas válidas para un recurrente en (start, end].
 * `time` es "HH:MM" en zona Ecuador (UTC-5).
 *
 * Convertimos a UTC sumando 5h al timestamp local — Cloud Run corre UTC.
 * Caso borde DST: Ecuador NO tiene horario de verano, así que es estable.
 */
function enumerateDates(
  frequency: RecurringTripFrequency,
  weekDays: number[] | undefined,
  dayOfMonth: number | undefined,
  time: string,
  start: Date,
  end: Date,
): Date[] {
  const [hh, mm] = time.split(':').map(Number);
  const result: Date[] = [];

  // Iteramos día por día desde start hasta end.
  // Cada candidato lo construimos en zona ECT (UTC-5) y lo pasamos a UTC.
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);

  // Empezamos al día siguiente del cursor (no creamos para hoy si ya pasó)
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (cursor <= end) {
    let matches = false;
    if (frequency === 'daily') {
      matches = true;
    } else if (frequency === 'weekly') {
      // En zona ECT (UTC-5), el día de la semana es:
      // ectDate = cursor - 5h
      const ectDate = new Date(cursor.getTime() - 5 * 3_600_000);
      const ectDay = ectDate.getUTCDay();
      matches = !!weekDays?.includes(ectDay);
    } else if (frequency === 'monthly') {
      const ectDate = new Date(cursor.getTime() - 5 * 3_600_000);
      matches = ectDate.getUTCDate() === dayOfMonth;
    }

    if (matches) {
      // Construimos el timestamp HH:MM en ECT → UTC = +5h
      const ectMidnight = new Date(cursor);
      ectMidnight.setUTCHours(hh + 5, mm, 0, 0);
      // Si esto resulta antes de start, no lo agregamos (ya pasó)
      if (ectMidnight > start && ectMidnight <= end) {
        result.push(ectMidnight);
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}
