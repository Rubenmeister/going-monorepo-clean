import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduledTripModel,
  ScheduledTripDocument,
  SeatReservation,
} from '../infrastructure/persistence/schemas/scheduled-trip.schema';
import { DriverAssignmentService } from './driver-assignment.service';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';
import { OutboxNotifier } from './outbox-notifier.service';

/**
 * ScheduledTripAssignmentCron — CONFIRMA el conductor definitivo de los viajes
 * COMPARTIDOS el día anterior a la salida (modelo Rubén 6/7-jul).
 *
 * Un `scheduled_trip` ya nace con `driverId` (el de la agenda que lo
 * materializó). Este cron NO elige de cero: la noche previa
 *   1. confirma al conductor del viaje (marca driverConfirmedAt), y
 *   2. SOLO si ese conductor ya no está comprometido al corredor a esa hora
 *      (se ausentó → quitó el slot de su agenda), REASIGNA al mejor alterno
 *      usando el scorer único (DriverAssignmentService).
 * Regla: "debería ser el mismo desde un inicio; en caso de ausencia se le daría
 * al nuevo".
 *
 * Basta ≥1 reserva: aunque no se haya llenado el cupo, el sistema ya designa
 * conductor y avisa a AMBOS (pasajera/o y conductora/or) que hay conductor para
 * el recorrido — sin esperar a última hora.
 *
 * Additive + apagado por defecto: no toca el flujo de 90 min (comunicación).
 * Toggle (env):
 *   SCHEDULED_ASSIGNMENT_ENABLED   default 'false' (opt-IN — se prende tras verificar)
 *   ASSIGNMENT_LEAD_HOURS          default 24  → confirmar viajes que salen dentro de N horas
 *   NOTIFICATIONS_SERVICE_URL      S2S push (best-effort; sin config, solo WS + log)
 *   INTERNAL_SERVICE_TOKEN         token role=system para el S2S
 */
@Injectable()
export class ScheduledTripAssignmentCron {
  private readonly logger = new Logger(ScheduledTripAssignmentCron.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(ScheduledTripModel.name)
    private readonly tripModel: Model<ScheduledTripDocument>,
    private readonly assignment: DriverAssignmentService,
    private readonly eventsGateway: RideEventsGateway,
    private readonly outbox: OutboxNotifier,
  ) {}

  private isEnabled(): boolean {
    // Opt-IN: nace apagado. Se prende con SCHEDULED_ASSIGNMENT_ENABLED=true
    // una vez verificado el motor con datos reales.
    return this.config.get<string>('SCHEDULED_ASSIGNMENT_ENABLED') === 'true';
  }

  private leadHours(): number {
    const v = parseInt(this.config.get<string>('ASSIGNMENT_LEAD_HOURS') ?? '24', 10);
    return Number.isFinite(v) && v >= 1 ? v : 24;
  }

  /**
   * Cada 30 min: confirma el conductor de los compartidos que salen dentro de la
   * ventana (día anterior) y todavía no fueron confirmados. 30 min da prontitud
   * para reservas de última hora sin castigar la DB (la asignación PRELIMINAR ya
   * vive en el trip desde la reserva; esto solo confirma/reasigna).
   */
  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'scheduled-trip-assignment' })
  async confirmUpcomingSharedTrips(): Promise<void> {
    if (!this.isEnabled()) return;

    const now = new Date();
    const horizon = new Date(now.getTime() + this.leadHours() * 3_600_000);

    let trips: ScheduledTripDocument[];
    try {
      trips = await this.tripModel
        .find({
          departureAt: { $gt: now, $lte: horizon },
          status: { $in: ['open', 'full'] },
          seatsReserved: { $gt: 0 },
          $or: [{ driverConfirmedAt: { $exists: false } }, { driverConfirmedAt: null }],
        })
        .sort({ departureAt: 1 })
        .limit(200)
        .exec();
    } catch (e) {
      this.logger.error(`[assign-cron] query falló: ${(e as Error).message}`);
      return;
    }

    if (!trips.length) return;
    this.logger.log(
      `[assign-cron] ${trips.length} viaje(s) compartido(s) por confirmar (lead=${this.leadHours()}h)`,
    );

    for (const trip of trips) {
      try {
        await this.confirmOne(trip, now);
      } catch (e) {
        this.logger.error(
          `[assign-cron] trip=${String(trip._id).slice(0, 8)} falló: ${(e as Error).message}`,
        );
        // Un fallo no aborta el tick.
      }
    }
  }

  /**
   * Abre la COMUNICACIÓN pasajera/o↔conductora/or 90 min antes de la salida,
   * para los viajes compartidos ya confirmados (simétrico al dispatcher de 90
   * min de los `rides` privados). Cada 10 min: los que salen dentro de 90 min,
   * con conductor confirmado y canal aún sin abrir → marca channelOpenedAt y
   * avisa a AMBOS. El gate visual del cliente ya abre por tiempo; esto agrega
   * el aviso push del momento.
   */
  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'scheduled-trip-channel-open' })
  async openUpcomingChannels(): Promise<void> {
    if (!this.isEnabled()) return;

    const now = new Date();
    const in90 = new Date(now.getTime() + 90 * 60_000);

    let trips: ScheduledTripDocument[];
    try {
      trips = await this.tripModel
        .find({
          departureAt: { $gt: now, $lte: in90 },
          status: { $in: ['open', 'full'] },
          seatsReserved: { $gt: 0 },
          driverConfirmedAt: { $ne: null },
          $or: [{ channelOpenedAt: { $exists: false } }, { channelOpenedAt: null }],
        })
        .sort({ departureAt: 1 })
        .limit(200)
        .exec();
    } catch (e) {
      this.logger.error(`[assign-cron] query canal falló: ${(e as Error).message}`);
      return;
    }
    if (!trips.length) return;

    for (const trip of trips) {
      try {
        // CAS: abre el canal SOLO si nadie lo abrió (evita push duplicado multi-pod).
        const res = await this.tripModel
          .updateOne(
            { _id: trip._id, $or: [{ channelOpenedAt: { $exists: false } }, { channelOpenedAt: null }] },
            { $set: { channelOpenedAt: now } },
          )
          .exec();
        if (res.modifiedCount !== 1) continue;
        const passengers = [
          ...new Set(
            (trip.reservations ?? []).map((r: SeatReservation) => r.userId).filter(Boolean),
          ),
        ];
        // WS
        try {
          this.eventsGateway['server']?.to(`trip:${String(trip._id)}`).emit('trip:channel_opened', {
            tripId: String(trip._id),
            driverId: trip.driverId,
            message: 'Ya puedes comunicarte con tu conductora o conductor para el viaje.',
            departureAt: trip.departureAt,
          });
        } catch {
          /* best-effort */
        }
        // Push a ambos vía OUTBOX (reintento + dead-letter, #16).
        const data = { tripId: String(trip._id), driverId: trip.driverId };
        for (const userId of [...passengers, trip.driverId].filter(Boolean)) {
          await this.outbox.enqueue({
            userId,
            type: 'trip_channel_opened',
            title: 'Comunicación disponible',
            body: 'Tu viaje compartido sale pronto. Ya puedes comunicarte en la app.',
            data,
          });
        }
        this.logger.log(
          `[assign-cron] trip=${String(trip._id).slice(0, 8)} canal abierto (${passengers.length} pasajero(s))`,
        );
      } catch (e) {
        this.logger.error(
          `[assign-cron] canal trip=${String(trip._id).slice(0, 8)} falló: ${(e as Error).message}`,
        );
      }
    }
  }

  private async confirmOne(trip: ScheduledTripDocument, now: Date): Promise<void> {
    // Decisión única (misma que expone el endpoint de verificación).
    const decision = await this.assignment.confirmDecision(
      trip.corridorId,
      trip.departureAt,
      trip.driverId,
    );

    if (decision.action === 'none') {
      // Nadie comprometido al corredor: no se puede confirmar. Se deja SIN
      // marcar (el próximo tick reintenta) y se alerta para revisión manual.
      this.logger.warn(
        `[assign-cron] trip=${String(trip._id).slice(0, 8)} ${trip.corridorId} ` +
          `@${trip.departureAt.toISOString()}: conductor ${trip.driverId} ausente y SIN alterno comprometido`,
      );
      return;
    }

    const assignedId = decision.chosenDriverId as string;
    const reassigned = decision.action === 'reassign';

    if (reassigned) {
      this.logger.log(
        `[assign-cron] trip=${String(trip._id).slice(0, 8)} REASIGNA ${trip.driverId} → ${assignedId} ` +
          `(ausencia; score=${decision.best?.score})`,
      );
    }

    // Persiste la confirmación (idempotente: driverConfirmedAt filtra el reintento).
    const update: Record<string, unknown> = {
      driverId: assignedId,
      driverConfirmedAt: now,
    };
    if (reassigned) {
      update.previousDriverId = trip.driverId;
      update.reassignedAt = now;
    }
    // CAS atómico: confirma SOLO si sigue sin confirmar. Si otro pod ganó la
    // carrera (modifiedCount 0), NO se vuelve a notificar (#14 anti-duplicado).
    const res = await this.tripModel
      .updateOne(
        { _id: trip._id, $or: [{ driverConfirmedAt: { $exists: false } }, { driverConfirmedAt: null }] },
        { $set: update },
      )
      .exec();
    if (res.modifiedCount !== 1) return;

    await this.notifyAssigned(trip, assignedId, reassigned);
  }

  /** Avisa a AMBOS: pasajera/os con reserva y la conductora/or asignada/o. */
  private async notifyAssigned(
    trip: ScheduledTripDocument,
    driverId: string,
    reassigned: boolean,
  ): Promise<void> {
    const tripId = String(trip._id);
    const passengers = [
      ...new Set((trip.reservations ?? []).map((r: SeatReservation) => r.userId).filter(Boolean)),
    ];

    // 1) WebSocket best-effort (app abierta lo recibe al instante).
    try {
      this.eventsGateway['server']?.to(`trip:${tripId}`).emit('trip:driver_assigned', {
        tripId,
        driverId,
        corridorId: trip.corridorId,
        departureAt: trip.departureAt,
        reassigned,
        message: 'Ya tienes conductora o conductor asignado para tu recorrido.',
      });
    } catch (e) {
      this.logger.warn(`[assign-cron] WS trip=${tripId.slice(0, 8)}: ${(e as Error).message}`);
    }

    // 2) Push vía OUTBOX (persistido + reintento + dead-letter, #16). Esta
    //    notificación es importante (idempotente: no se re-emite) → no puede
    //    perderse por un blip de notifications-service.
    const data = { tripId, driverId, corridorId: trip.corridorId, departureAt: trip.departureAt };
    for (const userId of passengers) {
      await this.outbox.enqueue({
        userId,
        type: 'trip_driver_assigned',
        title: 'Conductora o conductor asignado',
        body: 'Ya designamos quién te lleva en tu viaje compartido. Verás sus datos en la app.',
        data,
      });
    }
    await this.outbox.enqueue({
      userId: driverId,
      type: 'trip_driver_assigned',
      title: 'Tienes un viaje asignado',
      body: 'Se te asignó un viaje compartido para tu recorrido. Revisa los detalles en la app.',
      data,
    });

    this.logger.log(
      `[assign-cron] trip=${tripId.slice(0, 8)} confirmado → ${driverId} ` +
        `(${passengers.length} pasajero(s)${reassigned ? ', REASIGNADO' : ''})`,
    );
  }
}
