import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IRideRepository } from '../domain/ports';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';

/**
 * RideNoShowCronService — detecta y marca rides donde el conductor aceptó
 * pero nunca llegó al pickup dentro de la ventana esperada.
 *
 * Problema que resuelve (detectado en intensive-field-test, sesión 25-may):
 *   Si un driver acepta un ride y luego no se mueve / nunca marca arrival,
 *   el pasajero queda en spinner indefinido — el sistema no reasigna.
 *
 * Solución Phase 1 (este servicio):
 *   - Cron cada minuto busca rides en status='accepted' con
 *     acceptedAt + THRESHOLD_MIN < now AND arrivedAt IS NULL.
 *   - Marca como status='no_show' + cancellationReason='driver_no_show'.
 *   - Emite WS event `ride:driver_no_show` al pasajero — su app debería
 *     mostrar "El conductor no llegó. Pide otro viaje." con CTA.
 *
 * Phase 2 (futuro, no en este commit):
 *   Auto-rematch: re-dispatcher el mismo ride a otro driver excluyendo
 *   al que no se presentó. Requiere extender MatchAvailableDrivers para
 *   aceptar excludeDriverIds y el storage de driver_no_show_count para
 *   penalizar fairness.
 *
 * Toggle env:
 *   RIDE_NO_SHOW_DETECTION_ENABLED   default 'true' (opt-out por servicio)
 *   RIDE_NO_SHOW_THRESHOLD_MINUTES   default 5 (production)
 *
 * Concurrency:
 *   Multi-pod safe — el filtro de la query es por status (idempotente).
 *   Si dos pods marcan el mismo ride como no_show, el segundo update es
 *   no-op (el primer update ya cambió el status a no_show, query no lo
 *   devuelve en el segundo pod).
 */
@Injectable()
export class RideNoShowCronService {
  private readonly logger = new Logger(RideNoShowCronService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
    private readonly rideEvents: RideEventsGateway,
  ) {}

  private isEnabled(): boolean {
    return this.config.get<string>('RIDE_NO_SHOW_DETECTION_ENABLED') !== 'false';
  }

  private thresholdMinutes(): number {
    const v = parseInt(
      this.config.get<string>('RIDE_NO_SHOW_THRESHOLD_MINUTES') ?? '5',
      10,
    );
    return Number.isFinite(v) && v >= 1 ? v : 5;
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'ride-no-show-detector' })
  async detectNoShows(): Promise<void> {
    if (!this.isEnabled()) return;

    const t0 = Date.now();
    const threshold = this.thresholdMinutes();
    const cutoff = new Date(Date.now() - threshold * 60_000);

    // Limit defensivo — un solo cron tick no procesa más de 100 rides
    // (evita ahogarse si por algún bug se acumulan muchos).
    const candidates = await this.rideRepo.findByStatus('accepted', 100);
    if (!candidates || candidates.length === 0) return;

    const noShows = candidates.filter(
      (r: any) =>
        r.acceptedAt &&
        new Date(r.acceptedAt) < cutoff &&
        !r.arrivedAt,
    );
    if (noShows.length === 0) {
      this.logger.debug(
        `[no-show] sin candidatos · accepted=${candidates.length} threshold=${threshold}min`,
      );
      return;
    }

    let marked = 0;
    let failed = 0;
    for (const ride of noShows) {
      try {
        await this.rideRepo.update(ride.id, {
          status: 'no_show',
          cancellationReason: 'driver_no_show',
          cancellationTime: new Date(),
        });

        // Notificar al pasajero (no-blocking — si falla la emisión sigue).
        try {
          this.rideEvents.notifyNoShow(ride.id, {
            rideId: ride.id,
            driverId: ride.driverId,
            reason: `Conductor no llegó al punto de recogida en ${threshold} min`,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          this.logger.warn(
            `[no-show] WS notify falló ride=${ride.id}: ${(e as Error).message}`,
          );
        }

        this.logger.log(
          `[no-show] ride=${String(ride.id).slice(0, 8)} driver=${String(ride.driverId).slice(0, 8)} ` +
            `acceptedAt=${new Date(ride.acceptedAt).toISOString()} → status=no_show`,
        );
        marked++;
      } catch (e) {
        this.logger.error(
          `[no-show] update falló ride=${ride.id}: ${(e as Error).message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `[no-show] ciclo ok — candidates=${candidates.length} marked=${marked} failed=${failed} dt=${Date.now() - t0}ms`,
    );
  }
}
