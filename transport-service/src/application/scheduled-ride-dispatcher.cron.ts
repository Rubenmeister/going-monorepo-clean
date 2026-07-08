import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IRideRepository } from '../domain/ports';
import { RideMatchingService } from './ride-matching.service';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';

/**
 * ScheduledRideDispatcherCron — convierte viajes RESERVADOS en búsquedas
 * reales de conductor en el momento adecuado, y cierra el canal
 * conductor↔pasajero un rato después de terminado el viaje.
 *
 * Contexto (pedido de producto):
 *   - Si el pasajero reserva un viaje para más tarde / el día siguiente, el
 *     sistema NO debe buscar conductor de inmediato. El viaje queda anotado
 *     como "reservado para tal fecha, tal hora, con tal precio".
 *   - El sistema "abre" el canal entre conductor y pasajero 1 HORA Y MEDIA
 *     ANTES (configurable) de la hora reservada: ahí recién busca conductor y,
 *     al asignarlo, aparecen los datos del conductor para el pasajero. Toda la
 *     estructura de comunicación (mensajería, telefonía, tokens) nace en ese
 *     momento — requisito de producto.
 *   - El canal dura hasta UNA HORA DESPUÉS de terminado el viaje, luego cierra.
 *
 * Cómo encaja con lo que ya existía:
 *   - El flujo INMEDIATO ("en la ciudad") no cambia: RideController.requestRide
 *     dispara el matching al instante cuando no hay scheduledAt futuro.
 *   - Para reservas, requestRide crea el ride con status='scheduled' y NO
 *     dispara matching. Este cron lo hace cuando llega la ventana, reusando
 *     RideController.dispatchMatching (mismo matching del flujo inmediato).
 *
 * Toggle/config (env):
 *   SCHEDULED_DISPATCH_ENABLED        default 'true' (opt-out por servicio)
 *   MATCH_LEAD_TIME_MINUTES           default 90  → abrir canal/buscar conductor N min antes (1h30)
 *   CHANNEL_CLOSE_AFTER_MINUTES       default 60  → cerrar canal N min después de completedAt
 *
 * Idempotencia multi-pod:
 *   El despacho marca matchDispatchedAt; la query findScheduledDue lo excluye
 *   una vez seteado. Si dos pods corren a la vez, ambos podrían disparar el
 *   matching una vez (no fatal — el matching es notificación a drivers), pero
 *   solo uno persiste el flag. Aceptable: igual patrón que booking-dispatcher.
 */
@Injectable()
export class ScheduledRideDispatcherCron {
  private readonly logger = new Logger(ScheduledRideDispatcherCron.name);

  constructor(
    private readonly config: ConfigService,
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
    private readonly rideMatching: RideMatchingService,
    private readonly eventsGateway: RideEventsGateway,
  ) {}

  private isEnabled(): boolean {
    return this.config.get<string>('SCHEDULED_DISPATCH_ENABLED') !== 'false';
  }

  private leadTimeMinutes(): number {
    // 90 min (1h30) por requisito de producto: toda la comunicación del viaje
    // (mensajería, telefonía, tokens) nace hora y media antes de la salida.
    const v = parseInt(
      this.config.get<string>('MATCH_LEAD_TIME_MINUTES') ?? '90',
      10,
    );
    return Number.isFinite(v) && v >= 1 ? v : 90;
  }

  private channelCloseAfterMinutes(): number {
    const v = parseInt(
      this.config.get<string>('CHANNEL_CLOSE_AFTER_MINUTES') ?? '60',
      10,
    );
    return Number.isFinite(v) && v >= 1 ? v : 60;
  }

  /**
   * Cada minuto: despacha reservas cuya ventana (scheduledAt - lead) ya llegó.
   * EVERY_MINUTE da una latencia máxima de ~1 min respecto a la hora exacta de
   * apertura, suficiente para una ventana de 90 min.
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'scheduled-ride-dispatcher' })
  async dispatchDueReservations(): Promise<void> {
    if (!this.isEnabled()) return;
    if (typeof this.rideRepo.findScheduledDue !== 'function') {
      // Repo no implementa el método (ej. tests con mock parcial) — no-op.
      return;
    }

    const lead = this.leadTimeMinutes();
    const threshold = new Date(Date.now() + lead * 60_000);

    let due: any[];
    try {
      due = await this.rideRepo.findScheduledDue(threshold, 100);
    } catch (e) {
      this.logger.error(`[scheduled] findScheduledDue falló: ${(e as Error).message}`);
      return;
    }
    if (!due || due.length === 0) return;

    this.logger.log(`[scheduled] ${due.length} reserva(s) entran en ventana (lead=${lead}min)`);

    for (const ride of due) {
      try {
        await this.openChannelAndMatch(ride);
      } catch (e) {
        this.logger.error(
          `[scheduled] dispatch ride=${ride.id} falló: ${(e as Error).message}`,
        );
        // Seguimos con el siguiente — un fallo no aborta el tick.
      }
    }
  }

  private async openChannelAndMatch(ride: any): Promise<void> {
    const now = new Date();

    // CASO A — el motor día-anterior YA asignó conductor (driverConfirmedAt):
    // NO se re-matchea. Los 90 min sirven SOLO para abrir la comunicación
    // conductor↔pasajero sobre el conductor ya asignado (modelo Rubén).
    if (ride.driverConfirmedAt) {
      await this.rideRepo.update(ride.id, {
        status: 'accepted', // conductor ya asignado por agenda
        acceptedAt: ride.acceptedAt ?? now,
        channelOpenedAt: now,
      });
      try {
        this.eventsGateway['server']?.to(`ride:${ride.id}`).emit('ride:channel_opened', {
          rideId: ride.id,
          driverId: ride.driverId,
          message: 'Ya puedes comunicarte con tu conductora o conductor para el viaje.',
          scheduledAt: ride.scheduledAt,
          timestamp: now.toISOString(),
        });
      } catch (e) {
        this.logger.warn(`[scheduled] WS channel_opened ride=${ride.id}: ${(e as Error).message}`);
      }
      this.logger.log(
        `[scheduled] ride=${String(ride.id).slice(0, 8)} canal abierto (conductor ${ride.driverId} ya asignado, SIN matching)`,
      );
      return;
    }

    // CASO B — sin conductor asignado (urbano programado / privado sin corredor /
    // fallback): flujo normal de búsqueda de conductor en la ventana.
    // 1. Marca idempotente ANTES de disparar: si otro pod ya lo tomó, el
    //    update siguiente igual es inofensivo, pero esto reduce la ventana.
    await this.rideRepo.update(ride.id, {
      status: 'requested', // pasa de 'scheduled' al flujo normal de búsqueda
      matchDispatchedAt: now,
      channelOpenedAt: now,
    });

    // 2. Abre el canal: notifica al pasajero que empezó la búsqueda.
    try {
      this.eventsGateway['server']?.to(`ride:${ride.id}`).emit('ride:channel_opened', {
        rideId: ride.id,
        message: 'Estamos asignando tu conductor para el viaje reservado.',
        scheduledAt: ride.scheduledAt,
        timestamp: now.toISOString(),
      });
    } catch (e) {
      this.logger.warn(`[scheduled] WS channel_opened falló ride=${ride.id}: ${(e as Error).message}`);
    }

    // 3. Dispara el MISMO matching del flujo inmediato.
    const pickup = ride.pickupLocation ?? {};
    const dropoff = ride.dropoffLocation ?? {};
    this.rideMatching.dispatchMatching({
      rideId: ride.id,
      pickupLatitude: pickup.latitude ?? pickup.lat ?? 0,
      pickupLongitude: pickup.longitude ?? pickup.lon ?? 0,
      dropoffLatitude: dropoff.latitude ?? dropoff.lat ?? 0,
      dropoffLongitude: dropoff.longitude ?? dropoff.lon ?? 0,
      vehicleType: ride.serviceType || 'ANY',
      isCorporate: false,
    });

    this.logger.log(
      `[scheduled] ride=${String(ride.id).slice(0, 8)} canal abierto + matching disparado ` +
        `(scheduledAt=${ride.scheduledAt ? new Date(ride.scheduledAt).toISOString() : 'n/a'})`,
    );
  }

  /**
   * Cierra el canal conductor↔pasajero CHANNEL_CLOSE_AFTER_MINUTES después de
   * completedAt. Solo emite el evento de cierre y marca channelClosedAt; el
   * ride en sí ya está 'completed'.
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'scheduled-ride-channel-closer' })
  async closeStaleChannels(): Promise<void> {
    if (!this.isEnabled()) return;

    const closeAfter = this.channelCloseAfterMinutes();
    const cutoff = new Date(Date.now() - closeAfter * 60_000);

    if (typeof this.rideRepo.findChannelsToClose !== 'function') return; // mock parcial

    // Filtro en la QUERY (no en memoria): antes traía 100 completados arbitrarios
    // y filtraba en memoria → con >100 completados, los que debían cerrarse nunca
    // entraban y el canal nunca cerraba (#15).
    let toClose: any[];
    try {
      toClose = await this.rideRepo.findChannelsToClose(cutoff, 100);
    } catch (e) {
      this.logger.error(`[channel-close] findChannelsToClose falló: ${(e as Error).message}`);
      return;
    }
    if (!toClose || toClose.length === 0) return;

    for (const ride of toClose) {
      try {
        await this.rideRepo.update(ride.id, { channelClosedAt: new Date() });
        try {
          this.eventsGateway['server']?.to(`ride:${ride.id}`).emit('ride:channel_closed', {
            rideId: ride.id,
            message: 'El canal del viaje se cerró.',
            timestamp: new Date().toISOString(),
          });
        } catch {
          // emisión best-effort
        }
        this.logger.log(`[channel-close] ride=${String(ride.id).slice(0, 8)} canal cerrado`);
      } catch (e) {
        this.logger.error(`[channel-close] update ride=${ride.id} falló: ${(e as Error).message}`);
      }
    }
  }

  // ── Recordatorios push de viajes reservados (1h y 5min antes) ─────────────

  /**
   * Cada minuto: envía recordatorio ~1h antes y ~5min antes a cada reserva.
   * Idempotente por flag (reminder1hSentAt / reminder5mSentAt). El push llega a
   * los dispositivos registrados del usuario vía notifications-service (FCM);
   * además emite un evento WS para apps abiertas.
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'scheduled-ride-reminders' })
  async sendDueReminders(): Promise<void> {
    if (!this.isEnabled()) return;
    if (typeof this.rideRepo.findUpcomingNeedingReminder !== 'function') return;
    // Ventanas sin solape: 1h → (now+5min, now+60min]; 5min → (now, now+5min].
    await this.remindBucket('reminder1hSentAt', 5, 60, 'Tu viaje reservado se acerca');
    await this.remindBucket('reminder5mSentAt', 0, 5, 'Tu viaje está por salir');
  }

  private notificationsUrl(): string {
    return (this.config.get<string>('NOTIFICATIONS_SERVICE_URL') || 'http://localhost:3008').replace(/\/$/, '');
  }

  private async remindBucket(field: string, fromMin: number, toMin: number, title: string): Promise<void> {
    let due: any[];
    try {
      due = await this.rideRepo.findUpcomingNeedingReminder!(field, fromMin, toMin, 100);
    } catch (e) {
      this.logger.error(`[reminder] query ${field} falló: ${(e as Error).message}`);
      return;
    }
    if (!due || due.length === 0) return;

    for (const ride of due) {
      try {
        // CLAIM idempotente: marca antes de enviar (evita que otro pod duplique).
        await this.rideRepo.update(ride.id, { [field]: new Date() });
        const mins = ride.scheduledAt
          ? Math.max(1, Math.round((new Date(ride.scheduledAt).getTime() - Date.now()) / 60_000))
          : toMin;
        const body = `Tu viaje reservado sale en ~${mins} min.`;
        const sent = await this.sendReminderPush(ride.userId, title, body, ride.id);
        // Si la entrega falló, RELEASE (desmarca) para reintentar en el próximo
        // tick — antes se marcaba y se perdía el recordatorio para siempre (#10).
        if (!sent) {
          await this.rideRepo.update(ride.id, { [field]: null });
        }
        try {
          this.eventsGateway['server']?.to(`ride:${ride.id}`).emit('ride:reminder', {
            rideId: ride.id, minutes: mins, title, body,
          });
        } catch { /* WS best-effort */ }
      } catch (e) {
        this.logger.error(`[reminder] ride=${ride.id} ${field} falló: ${(e as Error).message}`);
      }
    }
  }

  /** Envía el push; devuelve true SOLO si la entrega fue aceptada (res.ok). */
  private async sendReminderPush(userId: string, title: string, body: string, rideId: string): Promise<boolean> {
    if (!userId) return false;
    const token = this.config.get<string>('INTERNAL_SERVICE_TOKEN');
    if (!token) {
      this.logger.warn('[reminder] INTERNAL_SERVICE_TOKEN ausente — push omitido');
      return false;
    }
    try {
      // Ruta REAL /notifications/send (sin /api) + token; fetch NO rechaza en
      // 4xx/5xx → hay que verificar res.ok explícitamente.
      const res = await fetch(`${this.notificationsUrl()}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, type: 'ride_reminder', title, body, channel: 'PUSH', data: { type: 'ride_reminder', rideId } }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`[reminder] push user=${userId} → HTTP ${res.status}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.warn(`[reminder] push a user=${userId} falló: ${(e as Error).message}`);
      return false;
    }
  }

  /**
   * WATCHDOG de búsquedas huérfanas (auditoría #9): la búsqueda de conductor
   * (runSearchWindow) corre en memoria del pod. Si el pod muere/redespliega a
   * mitad, el viaje queda en 'requested' sin nadie buscando. Cada minuto este
   * cron detecta esos viajes (lease `searchingUntil` vencido) y RE-DESPACHA el
   * matching desde un pod vivo. El re-dispatch renueva el lease de una, así que
   * el siguiente tick ya no lo ve huérfano.
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'search-watchdog' })
  async recoverStaleSearches(): Promise<void> {
    if (!this.isEnabled()) return;
    if (typeof this.rideRepo.findStaleSearches !== 'function') return;

    let stale: any[];
    try {
      stale = await this.rideRepo.findStaleSearches(new Date(), 50);
    } catch (e) {
      this.logger.error(`[watchdog] findStaleSearches falló: ${(e as Error).message}`);
      return;
    }
    if (!stale || stale.length === 0) return;

    this.logger.warn(`[watchdog] ${stale.length} búsqueda(s) huérfana(s) → re-despachando`);
    for (const ride of stale) {
      try {
        const pickup = ride.pickupLocation ?? {};
        const dropoff = ride.dropoffLocation ?? {};
        this.rideMatching.dispatchMatching({
          rideId: ride.id,
          pickupLatitude: pickup.latitude ?? pickup.lat ?? 0,
          pickupLongitude: pickup.longitude ?? pickup.lon ?? pickup.lng ?? 0,
          dropoffLatitude: dropoff.latitude ?? dropoff.lat ?? 0,
          dropoffLongitude: dropoff.longitude ?? dropoff.lon ?? dropoff.lng ?? 0,
          vehicleType: ride.serviceType || 'ANY',
          isCorporate: ride.paymentMethod === 'corporate',
        });
        this.logger.log(`[watchdog] ride=${String(ride.id).slice(0, 8)} re-despachado`);
      } catch (e) {
        this.logger.error(`[watchdog] re-dispatch ride=${ride.id} falló: ${(e as Error).message}`);
      }
    }
  }
}
