import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { IRideRepository } from '../domain/ports';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';

/**
 * ScheduledRideReminderCron — recordatorio 24h antes de un viaje reservado.
 *
 * Cada hora busca rides con `status='scheduled'` cuyo `scheduledAt` cae en
 * la ventana [+23h, +25h] desde ahora y todavía no recibió recordatorio.
 *
 * Para cada uno:
 *   - emite por WebSocket `ride:reminder_24h` (cliente abierto lo recibe)
 *   - hace S2S POST al notifications-service para que mande push (best-effort —
 *     si la integración no está configurada, el cron solo loggea y sigue)
 *   - marca `reminderSentAt` (idempotencia)
 *
 * Toggle (env):
 *   SCHEDULED_REMINDERS_ENABLED   default 'true'
 *   NOTIFICATIONS_SERVICE_URL     URL del notifications-service para S2S
 *   INTERNAL_SERVICE_TOKEN        token role=system para autenticar el S2S
 */
@Injectable()
export class ScheduledRideReminderCron {
  private readonly logger = new Logger(ScheduledRideReminderCron.name);

  constructor(
    private readonly config: ConfigService,
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
    private readonly eventsGateway: RideEventsGateway,
  ) {}

  private isEnabled(): boolean {
    return this.config.get<string>('SCHEDULED_REMINDERS_ENABLED') !== 'false';
  }

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    if (!this.isEnabled()) return;

    // Reusa el helper del repo agregado por commit 86018d2d (los crons 1h/5m
    // usan exactamente esta firma). Ventana 24h ≈ [now+23h, now+25h]
    // expresada en minutos: (1380, 1500].
    if (typeof this.rideRepo.findUpcomingNeedingReminder !== 'function') {
      this.logger.warn('[reminder] rideRepo.findUpcomingNeedingReminder no disponible — skip');
      return;
    }

    let due: any[] = [];
    try {
      due = await this.rideRepo.findUpcomingNeedingReminder(
        'reminderSentAt', 23 * 60, 25 * 60, 200,
      );
    } catch (e) {
      this.logger.error(`[reminder] query falló: ${(e as Error).message}`);
      return;
    }

    if (!due.length) return;
    this.logger.log(`[reminder] ${due.length} viaje(s) con recordatorio 24h`);

    for (const ride of due) {
      try {
        // 1) WebSocket — usuarios con app abierta lo reciben inmediato
        this.eventsGateway['server']
          ?.to(`ride:${ride._id ?? ride.id}`)
          .emit('ride:reminder_24h', {
            rideId: String(ride._id ?? ride.id),
            scheduledAt: ride.scheduledAt,
            message: 'Tu viaje es mañana — confírmalo en la app.',
          });

        // 2) S2S al notifications-service para push background (best-effort)
        await this.sendPush(ride).catch((err) =>
          this.logger.warn(`[reminder] push falló para ${ride._id}: ${err?.message ?? err}`),
        );

        // 3) Idempotencia
        await this.rideRepo.update(String(ride._id ?? ride.id), {
          reminderSentAt: new Date(),
        });
      } catch (e) {
        this.logger.error(`[reminder] fallo procesando ${ride._id}: ${(e as Error).message}`);
      }
    }
  }

  private async sendPush(ride: any): Promise<void> {
    const url = this.config.get<string>('NOTIFICATIONS_SERVICE_URL');
    const token = this.config.get<string>('INTERNAL_SERVICE_TOKEN');
    if (!url || !token) return; // Sin config, el cron solo loggea (mensaje WS sigue funcionando)

    await axios.post(
      `${url}/notifications/send`,
      {
        userId: ride.userId,
        type:   'ride_reminder_24h',
        title:  'Tu viaje es mañana',
        body:   'Going te recordará otra vez 1 hora antes. Si necesitas cancelar, hazlo desde la app.',
        data:   { rideId: String(ride._id ?? ride.id), scheduledAt: ride.scheduledAt },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      },
    );

    if (ride.driverId) {
      await axios.post(
        `${url}/notifications/send`,
        {
          userId: ride.driverId,
          type:   'ride_reminder_24h',
          title:  'Recordatorio de viaje',
          body:   'Mañana tienes un viaje reservado en Going. Revisa los detalles.',
          data:   { rideId: String(ride._id ?? ride.id), scheduledAt: ride.scheduledAt },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        },
      ).catch(() => undefined);
    }
  }
}
