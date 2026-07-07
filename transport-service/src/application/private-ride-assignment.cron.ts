import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import {
  RideModelSchema,
  RideDocument,
} from '../infrastructure/persistence/schemas/ride.schema';
import { DriverAssignmentService } from './driver-assignment.service';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';

/**
 * PrivateRideAssignmentCron — asigna/confirma el conductor DEFINITIVO de los
 * viajes PRIVADOS (intercity, programados) el día anterior, con el mismo motor
 * de agendas que compartido (modelo Rubén: el privado también sale de las
 * agendas, no del matching de 90 min).
 *
 * Diferencia con compartido: el privado vive en `rides` (punto-a-punto, sin
 * corredor guardado) → se DERIVA el corredor de las coordenadas
 * (`resolveCorridorForCoords`). Si el viaje es urbano o no cae en un corredor
 * definido, NO es de este carril (va por realtime) y se ignora.
 *
 * Cada 30 min, para cada `ride` privado/corporativo con status='scheduled' que
 * sale dentro de ASSIGNMENT_LEAD_HOURS (24h) y aún sin confirmar:
 *   - deriva corredor; si no hay → skip;
 *   - decide con confirmDecision (keep si el preliminar sigue comprometido /
 *     reassign si se ausentó / none si nadie comprometido);
 *   - persiste driverId + driverConfirmedAt (+previousDriverId si reasigna);
 *   - avisa a AMBOS (pasajera/o + conductora/or) por WS + push S2S.
 * El dispatcher de 90 min ve driverConfirmedAt y NO re-matchea (solo comunica).
 *
 * Additive + apagado por defecto. Toggle:
 *   PRIVATE_ASSIGNMENT_ENABLED   default 'false' (opt-IN tras verificar)
 *   ASSIGNMENT_LEAD_HOURS        default 24 (compartido con el cron de compartido)
 *   NOTIFICATIONS_SERVICE_URL / INTERNAL_SERVICE_TOKEN   push S2S best-effort
 */
@Injectable()
export class PrivateRideAssignmentCron {
  private readonly logger = new Logger(PrivateRideAssignmentCron.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(RideModelSchema.name)
    private readonly rideModel: Model<RideDocument>,
    private readonly assignment: DriverAssignmentService,
    private readonly eventsGateway: RideEventsGateway,
  ) {}

  private isEnabled(): boolean {
    return this.config.get<string>('PRIVATE_ASSIGNMENT_ENABLED') === 'true';
  }

  private leadHours(): number {
    const v = parseInt(this.config.get<string>('ASSIGNMENT_LEAD_HOURS') ?? '24', 10);
    return Number.isFinite(v) && v >= 1 ? v : 24;
  }

  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'private-ride-assignment' })
  async confirmUpcomingPrivateRides(): Promise<void> {
    if (!this.isEnabled()) return;

    const now = new Date();
    const horizon = new Date(now.getTime() + this.leadHours() * 3_600_000);

    let rides: RideDocument[];
    try {
      rides = await this.rideModel
        .find({
          status: 'scheduled',
          modalidad: { $ne: 'compartido' }, // privado + corporativo + legacy; compartido va por scheduled_trips
          scheduledAt: { $gt: now, $lte: horizon },
          $or: [{ driverConfirmedAt: { $exists: false } }, { driverConfirmedAt: null }],
        })
        .limit(200)
        .exec();
    } catch (e) {
      this.logger.error(`[priv-assign] query falló: ${(e as Error).message}`);
      return;
    }

    if (!rides.length) return;
    this.logger.log(
      `[priv-assign] ${rides.length} viaje(s) privado(s) programado(s) por confirmar (lead=${this.leadHours()}h)`,
    );

    for (const ride of rides) {
      try {
        await this.confirmOne(ride, now);
      } catch (e) {
        this.logger.error(
          `[priv-assign] ride=${String(ride._id).slice(0, 8)} falló: ${(e as Error).message}`,
        );
      }
    }
  }

  private async confirmOne(ride: RideDocument, now: Date): Promise<void> {
    const scheduledAt = ride.scheduledAt ? new Date(ride.scheduledAt) : null;
    if (!scheduledAt) return;

    const pu = (ride.pickupLocation ?? {}) as any;
    const dp = (ride.dropoffLocation ?? {}) as any;
    const corridor = this.assignment.resolveCorridorForCoords(
      pu.latitude ?? pu.lat,
      pu.longitude ?? pu.lng ?? pu.lon,
      dp.latitude ?? dp.lat,
      dp.longitude ?? dp.lng ?? dp.lon,
    );
    if (!corridor) {
      // Urbano o fuera de corredor: no es de este carril (va por realtime).
      return;
    }

    const currentDriverId = ride.driverId ?? '';
    const decision = await this.assignment.confirmDecision(
      corridor.corridorId,
      scheduledAt,
      currentDriverId,
    );

    if (decision.action === 'none') {
      this.logger.warn(
        `[priv-assign] ride=${String(ride._id).slice(0, 8)} ${corridor.corridorId} ` +
          `@${scheduledAt.toISOString()}: sin conductor comprometido`,
      );
      return;
    }

    const assignedId = decision.chosenDriverId as string;
    const reassigned = decision.action === 'reassign' && !!currentDriverId;

    const update: Record<string, unknown> = {
      driverId: assignedId,
      driverConfirmedAt: now,
    };
    if (reassigned) {
      update.previousDriverId = currentDriverId;
      update.reassignedAt = now;
    }
    await this.rideModel.updateOne({ _id: ride._id }, { $set: update }).exec();

    this.logger.log(
      `[priv-assign] ride=${String(ride._id).slice(0, 8)} ${corridor.corridorId} → ${assignedId} ` +
        `(${decision.action}${reassigned ? `, era ${currentDriverId}` : ''})`,
    );

    await this.notifyAssigned(ride, assignedId, reassigned);
  }

  /** Avisa a AMBOS: pasajera/o del viaje y conductora/or asignada/o. */
  private async notifyAssigned(
    ride: RideDocument,
    driverId: string,
    reassigned: boolean,
  ): Promise<void> {
    const rideId = String(ride._id);

    // 1) WebSocket best-effort.
    try {
      this.eventsGateway['server']?.to(`ride:${rideId}`).emit('ride:driver_assigned', {
        rideId,
        driverId,
        scheduledAt: ride.scheduledAt,
        reassigned,
        message: 'Ya tienes conductora o conductor asignado para tu viaje.',
      });
    } catch (e) {
      this.logger.warn(`[priv-assign] WS ride=${rideId.slice(0, 8)}: ${(e as Error).message}`);
    }

    // 2) Push S2S best-effort.
    const url = this.config.get<string>('NOTIFICATIONS_SERVICE_URL');
    const token = this.config.get<string>('INTERNAL_SERVICE_TOKEN');
    if (!url || !token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const data = { rideId, driverId, scheduledAt: ride.scheduledAt };

    if (ride.userId) {
      await axios
        .post(
          `${url}/notifications/send`,
          {
            userId: ride.userId,
            type: 'ride_driver_assigned',
            title: 'Conductora o conductor asignado',
            body: 'Ya designamos quién te lleva en tu viaje. Verás sus datos en la app.',
            data,
          },
          { headers, timeout: 5000 },
        )
        .catch((err) =>
          this.logger.warn(`[priv-assign] push pasajero ${ride.userId}: ${err?.message ?? err}`),
        );
    }

    await axios
      .post(
        `${url}/notifications/send`,
        {
          userId: driverId,
          type: 'ride_driver_assigned',
          title: 'Tienes un viaje asignado',
          body: 'Se te asignó un viaje para tu recorrido. Revisa los detalles en la app.',
          data,
        },
        { headers, timeout: 5000 },
      )
      .catch((err) =>
        this.logger.warn(`[priv-assign] push conductor ${driverId}: ${err?.message ?? err}`),
      );
  }
}
