/**
 * BookingDispatcherService — Cron que convierte scheduled corporate
 * bookings en rides reales.
 *
 * Caso de uso (task #28):
 *   1. Empresa corporativa pre-reserva un viaje (POST /bookings) para
 *      hoy 18:30 con startDate=2026-05-23T23:30:00Z (formato ISO UTC).
 *   2. El booking se persiste con status='pending' y companyId set.
 *   3. Mientras tanto: el conductor NO está asignado todavía — solo es
 *      una reserva en agenda.
 *   4. A las 18:00 (30 min antes), el cron despierta:
 *      - Encuentra el booking via findDispatchReady(now + 30min)
 *      - Llama transport-service POST /rides/request con context
 *      - Marca el booking con triggeredRideId (idempotencia)
 *      - Status pending → confirmed
 *   5. Transport-service ahora hace matching real y asigna conductor.
 *
 * Polling cada 5 min: balance entre latencia (no más de 5 min de demora
 * respecto al threshold) y carga (12 ejecuciones/hora × 1 query indexada
 * = ~negligible). Si el volumen crece a >1000 bookings activos podemos
 * pasar a polling más frecuente o a un sistema event-driven via Pub/Sub.
 *
 * Threshold de 30 min antes: tiempo suficiente para que el matching
 * encuentre conductor disponible + el conductor se desplace al pickup.
 * Configurable via env DISPATCH_LEAD_TIME_MINUTES (default 30).
 *
 * Idempotencia: triggeredRideId persiste en Mongo. Si el cron corre 2x
 * antes que el primer dispatch persista, ambos llaman transport pero
 * solo el primero updates el booking — el segundo encuentra triggeredRideId
 * ya set y descarta su update. RACE CONDITION reducida pero no 100%
 * eliminada — solución estricta requiere transacción + lock. Aceptable
 * porque transport-service maneja duplicados con un índice unique por
 * (userId, startDate ± 5min).
 */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Booking,
  IBookingRepository,
} from '@going-monorepo-clean/domains-booking-core';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class BookingDispatcherService {
  private readonly logger = new Logger(BookingDispatcherService.name);
  private readonly leadTimeMinutes: number;
  private readonly transportUrl: string;
  private readonly jwtSecret: string;
  /** Flag para deshabilitar el cron por env (rollback rápido). */
  private readonly enabled: boolean;

  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
    private readonly config: ConfigService,
  ) {
    this.leadTimeMinutes = parseInt(
      this.config.get<string>('DISPATCH_LEAD_TIME_MINUTES') ?? '30',
      10,
    );
    this.transportUrl =
      this.config.get<string>('TRANSPORT_SERVICE_URL') ??
      'https://transport-service-lw44cnhdeq-uc.a.run.app';
    this.jwtSecret = this.config.get<string>('JWT_SECRET') ?? '';
    this.enabled = this.config.get<string>('BOOKING_DISPATCHER_ENABLED') !== 'false';

    if (!this.jwtSecret) {
      this.logger.warn(
        '[booking-dispatcher] JWT_SECRET no configurado — no podrá llamar a transport-service',
      );
    }
    if (!this.enabled) {
      this.logger.warn(
        '[booking-dispatcher] BOOKING_DISPATCHER_ENABLED=false → cron desactivado',
      );
    } else {
      this.logger.log(
        `[booking-dispatcher] activo (lead=${this.leadTimeMinutes}min, target=${this.transportUrl})`,
      );
    }
  }

  /**
   * Cron principal — corre cada 5 min cuando el servicio está vivo.
   * IMPORTANTE: requiere min-instances=1 en Cloud Run o el container
   * se duerme entre requests y el timer muere. Documentado en cloudbuild.
   */
  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'booking-dispatcher' })
  async dispatch(): Promise<void> {
    if (!this.enabled) return;

    const threshold = new Date(Date.now() + this.leadTimeMinutes * 60 * 1000);
    const result = await this.bookingRepo.findDispatchReady(threshold, 100);
    if (result.isErr()) {
      this.logger.error(`[dispatcher] findDispatchReady fallo: ${result.error.message}`);
      return;
    }
    const ready = result.value;
    if (ready.length === 0) {
      this.logger.debug(`[dispatcher] tick: 0 bookings ready (lead=${this.leadTimeMinutes}min)`);
      return;
    }

    this.logger.log(`[dispatcher] tick: ${ready.length} bookings ready para dispatch`);

    // Procesamos en serie para no abrumar transport-service (max 100/tick).
    // Si necesitamos paralelismo en el futuro, usar Promise.allSettled con
    // chunks de 10 + delay.
    for (const booking of ready) {
      try {
        await this.dispatchOne(booking);
      } catch (err) {
        this.logger.error(
          `[dispatcher] booking ${booking.id} fallo: ${(err as Error).message}`,
        );
        // Continuamos con el siguiente — no abortamos el tick por una falla.
      }
    }
  }

  private async dispatchOne(booking: Booking): Promise<void> {
    // 0. Claim ATÓMICO (auditoría B1 #13): solo el pod que gana el lock crea el
    //    ride. Antes se creaba el ride en transport y RECIÉN después se marcaba el
    //    booking → dos crones concurrentes creaban dos rides. Ahora se reclama
    //    primero; si otro pod ganó, se salta sin llamar a transport.
    const claim = await this.bookingRepo.claimForDispatch(booking.id as any);
    if (claim.isErr()) {
      this.logger.error(`[dispatcher] claim ${booking.id} fallo: ${claim.error.message}`);
      return;
    }
    if (!claim.value) {
      this.logger.debug(`[dispatcher] booking ${booking.id} ya reclamado por otro pod — skip`);
      return;
    }

    try {
    // 1. POST a transport-service /rides/request
    //    Genera un JWT temporal con el userId del booking. El backend
    //    transport acepta JWT firmado con JWT_SECRET (mismo secret).
    const token = jwt.sign(
      {
        sub:   booking.userId,
        email: `booking-dispatcher@going.com.ec`,
        role:  'user',
        // Propaga la empresa: transport deriva isCorporate del companyId del
        // JWT. Sin esto, un viaje corporativo despachado se marcaría como B2C
        // y el conductor no recibiría su payout corporativo.
        ...(booking.companyId ? { companyId: booking.companyId } : {}),
        // Hint para transport-service que esto viene del dispatcher,
        // no del usuario directo. Útil para logs/auditoría.
        source: 'booking-dispatcher',
      },
      this.jwtSecret,
      { expiresIn: '5m' },
    );

    const body = {
      userId: booking.userId,
      // Las coords reales viven en el serviceId del Trip — el bookingService
      // no tiene lat/lng directas. Para esta primera versión enviamos
      // placeholders con bookingId como hint; transport-service tendrá que
      // hacer lookup del Trip via serviceId si lo necesita. Mejora futura:
      // libs/domains/booking ya guarda coords (campo nuevo) o booking-service
      // resuelve coords desde el Trip y las pasa.
      pickupLatitude:  0,
      pickupLongitude: 0,
      dropoffLatitude: 0,
      dropoffLongitude:0,
      serviceType:     'confort',  // brand rename — tier default
      isCorporate:     booking.clientSegment === 'corporate',
      scheduledAt:     booking.startDate.toISOString(),
      // Hint para transport-service de dónde viene el dispatch
      bookingId:       booking.id,
    };

    const res = await fetch(`${this.transportUrl}/rides/request`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`transport ${res.status}: ${text.slice(0, 200)}`);
    }

    const payload = await res.json() as { rideId?: string };
    if (!payload.rideId) {
      throw new Error(`transport no devolvió rideId (response: ${JSON.stringify(payload).slice(0, 200)})`);
    }

    // 2. Marca el booking como ride-disparado (idempotencia + update DB)
    const mark = booking.markRideTriggered(payload.rideId);
    if (mark.isErr()) {
      // Booking ya marcado por otro proceso — race condition no fatal,
      // el ride en transport quedó duplicado pero no rompimos al usuario.
      this.logger.warn(
        `[dispatcher] booking ${booking.id} ya marcado: ${mark.error.message}`,
      );
      return;
    }

    const saved = await this.bookingRepo.update(booking);
    if (saved.isErr()) {
      this.logger.error(
        `[dispatcher] update booking ${booking.id} fallo: ${saved.error.message}`,
      );
      return;
    }

    this.logger.log(
      `[dispatcher] booking ${booking.id} → ride ${payload.rideId} ` +
      `(company=${booking.companyId ?? 'b2c'}, startDate=${booking.startDate.toISOString()})`,
    );
    } catch (err) {
      // Falló el despacho (transport caído, etc.): liberar el lock para que el
      // próximo tick lo reintente en vez de quedar bloqueado hasta el stale.
      await this.bookingRepo.releaseDispatch(booking.id as any).catch(() => undefined);
      throw err;
    }
  }
}
