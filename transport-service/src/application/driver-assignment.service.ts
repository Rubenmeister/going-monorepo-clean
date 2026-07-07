import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CORRIDORS_BY_ID } from 'pricing';
import { DriverScheduleModel } from '../api/driver-schedule.controller';
import { DriverRatingModel, DriverRatingDocument } from '../api/driver.controller';
import {
  RideModelSchema,
  RideDocument,
} from '../infrastructure/persistence/schemas/ride.schema';
import { deriveTripSeedsForDate, type DriverAgenda } from './scheduled-trip.logic';
import {
  pickBestDriver,
  type DriverCandidate,
  type ScoredDriver,
} from './driver-scoring';

/**
 * DriverAssignmentService — asigna conductor a un recorrido usando el SCORER
 * único (driver-scoring). Modelo Rubén 6-jul:
 *   - Candidatos = conductores COMPROMETIDOS (driver_schedules) al corredor a esa
 *     hora (reusa deriveTripSeedsForDate, igual que la materialización de compartido).
 *   - Se puntúan por EQUIDAD (viajes ya asignados ese día) + rating + disponibilidad.
 * Esta MISMA función sirve para el preliminar al reservar, el definitivo del día
 * anterior y las reasignaciones (solo cambia CUÁNDO se llama).
 *
 * v1 simple (afinable): disponibilidad = comprometido (refinar con online/no
 * doble-booked); proximidad inherente al corredor (los candidatos ya cubren esa
 * ruta) → distanceKm null. La equidad (viajes del día) es el diferenciador.
 */
@Injectable()
export class DriverAssignmentService {
  private readonly logger = new Logger(DriverAssignmentService.name);

  constructor(
    @InjectModel(DriverScheduleModel.name)
    private readonly scheduleModel: Model<any>,
    @InjectModel(DriverRatingModel.name)
    private readonly ratingModel: Model<DriverRatingDocument>,
    @InjectModel(RideModelSchema.name)
    private readonly rideModel: Model<RideDocument>,
  ) {}

  /**
   * Elige el mejor conductor comprometido al `corridorId` cerca de `scheduledAt`.
   * Devuelve null si no hay ningún conductor con agenda para ese corredor/hora.
   */
  async pickDriverForCorridor(
    corridorId: string,
    scheduledAt: Date,
  ): Promise<ScoredDriver | null> {
    const corridor = CORRIDORS_BY_ID[corridorId];
    if (!corridor) {
      this.logger.warn(`[assign] corredor desconocido: ${corridorId}`);
      return null;
    }

    // 1) Agendas de conductores comprometidos a ese corredor.
    const agendas = (await this.scheduleModel
      .find({ 'slots.routeId': corridorId })
      .lean()) as unknown as Array<{
      driverId: string;
      slots: any[];
      vehicleType?: string;
    }>;
    if (agendas.length === 0) return null;

    // 2) Materializa las salidas de ese día y quédate con las cercanas a la hora
    //    pedida (ventana ±45 min → tolerante a redondeos/desfases menores).
    const seeds = deriveTripSeedsForDate(
      agendas.map<DriverAgenda>((a) => ({
        driverId: a.driverId,
        slots: a.slots,
        vehicleType: a.vehicleType,
      })),
      corridor,
      scheduledAt,
    );
    const windowMs = 45 * 60 * 1000;
    const committed = seeds.filter(
      (s) => Math.abs(s.departureAt.getTime() - scheduledAt.getTime()) <= windowMs,
    );
    const driverIds = [...new Set(committed.map((s) => s.driverId))];
    if (driverIds.length === 0) return null;

    // 3) Insumos del scoring: equidad (viajes del día) + rating.
    const [tripsToday, ratings] = await Promise.all([
      this.tripsTodayByDriver(driverIds, scheduledAt),
      this.avgRatings(driverIds),
    ]);

    const candidates: DriverCandidate[] = driverIds.map((id) => ({
      driverId: id,
      tripsToday: tripsToday[id] ?? 0,
      rating: ratings[id] ?? 4.5,
      distanceKm: null, // v1: proximidad inherente al corredor comprometido
      available: true, // v1: comprometido = disponible (refinar: online/no doble-booked)
    }));

    const best = pickBestDriver(candidates);
    if (best) {
      this.logger.log(
        `[assign] ${corridorId} @${scheduledAt.toISOString()} → ${best.driverId} ` +
          `(score=${best.score}, viajes=${best.tripsToday}, ★${best.rating.toFixed(1)}, ` +
          `de ${driverIds.length} candidato(s))`,
      );
    }
    return best;
  }

  /** Viajes ya asignados a cada conductor ese día (factor de EQUIDAD). */
  private async tripsTodayByDriver(
    driverIds: string[],
    date: Date,
  ): Promise<Record<string, number>> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    try {
      const rows = (await this.rideModel.aggregate([
        {
          $match: {
            driverId: { $in: driverIds },
            status: { $nin: ['cancelled', 'no_driver'] },
            scheduledAt: { $gte: start, $lt: end },
          },
        },
        { $group: { _id: '$driverId', n: { $sum: 1 } } },
      ])) as Array<{ _id: string; n: number }>;
      const map: Record<string, number> = {};
      for (const r of rows) map[r._id] = r.n;
      return map;
    } catch (e) {
      this.logger.warn(`[assign] tripsToday falló: ${(e as Error).message}`);
      return {};
    }
  }

  /** Promedio de calificación por conductor (driver_ratings). */
  private async avgRatings(driverIds: string[]): Promise<Record<string, number>> {
    if (driverIds.length === 0) return {};
    try {
      const rows = (await this.ratingModel.aggregate([
        { $match: { driverId: { $in: driverIds } } },
        { $group: { _id: '$driverId', avg: { $avg: '$rating' } } },
      ])) as Array<{ _id: string; avg: number }>;
      const map: Record<string, number> = {};
      for (const r of rows) map[r._id] = r.avg;
      return map;
    } catch (e) {
      this.logger.warn(`[assign] avgRatings falló: ${(e as Error).message}`);
      return {};
    }
  }
}
