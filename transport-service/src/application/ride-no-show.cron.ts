import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IRideRepository } from '../domain/ports';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';
import { RideMatchingService } from './ride-matching.service';

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
 * Phase 2 (auto-rematch, 12-jul):
 *   Cuando RIDE_AUTO_REMATCH_ENABLED='true', en vez de dejar el ride en
 *   'no_show' terminal, el sistema lo re-asigna AUTOMÁTICAMENTE a otro
 *   conductor: agrega al ausente a rejectedByDriverIds (RideMatchingService
 *   ya excluye a los rechazados), resetea el ride a 'requested' y re-dispara
 *   dispatchMatching (mismo carril del flujo inmediato). Se topa en
 *   RIDE_AUTO_REMATCH_MAX intentos; superado, cae a 'no_show' terminal y el
 *   pasajero pide otro viaje. Da CERTEZA al cliente sin intervención manual.
 *
 * Toggle env:
 *   RIDE_NO_SHOW_DETECTION_ENABLED   default 'true' (opt-out por servicio)
 *   RIDE_NO_SHOW_THRESHOLD_MINUTES   default 5 (production)
 *   RIDE_AUTO_REMATCH_ENABLED        default 'false' (opt-in — Phase 2)
 *   RIDE_AUTO_REMATCH_MAX            default 2 (reintentos antes de rendirse)
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
    private readonly rideMatching: RideMatchingService,
  ) {}

  private isEnabled(): boolean {
    return this.config.get<string>('RIDE_NO_SHOW_DETECTION_ENABLED') !== 'false';
  }

  private autoRematchEnabled(): boolean {
    return this.config.get<string>('RIDE_AUTO_REMATCH_ENABLED') === 'true';
  }

  private autoRematchMax(): number {
    const v = parseInt(this.config.get<string>('RIDE_AUTO_REMATCH_MAX') ?? '2', 10);
    return Number.isFinite(v) && v >= 1 ? v : 2;
  }

  private thresholdMinutes(): number {
    const v = parseInt(
      this.config.get<string>('RIDE_NO_SHOW_THRESHOLD_MINUTES') ?? '5',
      10,
    );
    return Number.isFinite(v) && v >= 1 ? v : 5;
  }

  /**
   * Auto-rematch: re-asigna el ride a otro conductor excluyendo al ausente.
   * Devuelve true si disparó rematch, false si hay que marcar no_show terminal
   * (rematch deshabilitado, sin coords, o topó el máximo de reintentos).
   */
  private async tryRematch(ride: any, threshold: number): Promise<boolean> {
    if (!this.autoRematchEnabled()) return false;

    const attempts = (ride.rematchCount ?? 0) + 1;
    if (attempts > this.autoRematchMax()) {
      this.logger.warn(
        `[no-show] ride=${String(ride.id).slice(0, 8)} topó rematch (${ride.rematchCount}) → no_show terminal`,
      );
      return false;
    }

    const pickup = ride.pickupLocation ?? {};
    const dropoff = ride.dropoffLocation ?? {};
    const pLat = pickup.latitude ?? pickup.lat;
    const pLng = pickup.longitude ?? pickup.lon;
    if (typeof pLat !== 'number' || typeof pLng !== 'number') {
      this.logger.warn(`[no-show] ride=${String(ride.id).slice(0, 8)} sin coords de pickup → no rematch`);
      return false;
    }

    // 1. Excluir al conductor ausente (RideMatchingService ya filtra rejectedByDriverIds).
    if (ride.driverId) await this.rideRepo.addRejection(ride.id, ride.driverId);

    // 2. Resetear el ride a 'requested' limpiando la asignación previa.
    await this.rideRepo.update(ride.id, {
      status: 'requested',
      previousDriverId: ride.driverId ?? null,
      driverId: null,
      acceptedAt: null,
      arrivedAt: null,
      searchingUntil: null,
      requestedAt: new Date(),
      rematchCount: attempts,
      cancellationReason: null,
    });

    // 3. Avisar al pasajero que buscamos otro conductor (no es "pide otro viaje").
    try {
      this.rideEvents.notifyRematching(ride.id, {
        rideId: ride.id,
        previousDriverId: ride.driverId,
        attempt: attempts,
        message: `Tu conductor no llegó. Estamos asignando otro automáticamente (intento ${attempts}).`,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      this.logger.warn(`[no-show] WS rematching notify falló ride=${ride.id}: ${(e as Error).message}`);
    }

    // 4. Re-disparar el MISMO matching del flujo inmediato (fire-and-forget).
    this.rideMatching.dispatchMatching({
      rideId: ride.id,
      pickupLatitude: pLat,
      pickupLongitude: pLng,
      dropoffLatitude: dropoff.latitude ?? dropoff.lat ?? 0,
      dropoffLongitude: dropoff.longitude ?? dropoff.lon ?? 0,
      vehicleType: ride.serviceType || 'ANY',
      isCorporate: (ride.modalidad === 'corporate') || false,
    });

    this.logger.log(
      `[no-show] ride=${String(ride.id).slice(0, 8)} AUTO-REMATCH intento ${attempts} ` +
        `(excluye driver=${String(ride.driverId).slice(0, 8)})`,
    );
    return true;
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
    let rematched = 0;
    let failed = 0;
    for (const ride of noShows) {
      try {
        // Phase 2: intentar reasignar automáticamente. Si logra rematch, el ride
        // vuelve a 'requested' y NO se marca no_show terminal.
        const didRematch = await this.tryRematch(ride, threshold);
        if (didRematch) {
          rematched++;
          continue;
        }

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
      `[no-show] ciclo ok — candidates=${candidates.length} rematched=${rematched} marked=${marked} failed=${failed} dt=${Date.now() - t0}ms`,
    );
  }
}
