import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CORRIDORS_BY_ID, resolveCityWithBuffer, findCorridorForCities } from 'pricing';
import { DriverScheduleModel } from '../api/driver-schedule.controller';
import { DriverRatingModel, DriverRatingDocument } from '../api/driver.controller';
import {
  RideModelSchema,
  RideDocument,
} from '../infrastructure/persistence/schemas/ride.schema';
import { deriveTripSeedsForDate, type DriverAgenda } from './scheduled-trip.logic';
import {
  pickBestDriver,
  scoreDrivers,
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
    const candidates = await this.gatherCandidates(corridorId, scheduledAt);
    if (candidates === null || candidates.length === 0) return null;

    const best = pickBestDriver(candidates);
    if (best) {
      this.logger.log(
        `[assign] ${corridorId} @${scheduledAt.toISOString()} → ${best.driverId} ` +
          `(score=${best.score}, viajes=${best.tripsToday}, ★${best.rating.toFixed(1)}, ` +
          `de ${candidates.length} candidato(s))`,
      );
    }
    return best;
  }

  /**
   * Vista previa read-only: qué decidiría el scorer para `corridorId` cerca de
   * `scheduledAt`, con TODOS los candidatos rankeados (no solo el mejor). Sirve
   * para verificar el motor con datos reales ANTES de automatizar la asignación.
   */
  async previewAssignment(
    corridorId: string,
    scheduledAt: Date,
  ): Promise<{
    corridorId: string;
    corridorKnown: boolean;
    scheduledAt: string;
    count: number;
    best: ScoredDriver | null;
    ranked: ScoredDriver[];
  }> {
    const known = !!CORRIDORS_BY_ID[corridorId];
    const candidates = await this.gatherCandidates(corridorId, scheduledAt);
    const ranked = candidates ? scoreDrivers(candidates) : [];
    return {
      corridorId,
      corridorKnown: known,
      scheduledAt: scheduledAt.toISOString(),
      count: ranked.length,
      best: ranked[0] ?? null,
      ranked,
    };
  }

  /**
   * DECISIÓN de confirmación día-anterior para un viaje con `currentDriverId`.
   * Fuente ÚNICA que comparten el cron y el endpoint de verificación:
   *   - 'keep'     → el conductor sigue comprometido al corredor/hora (definitivo = el mismo).
   *   - 'reassign' → se ausentó (ya no está entre los candidatos) → mejor alterno.
   *   - 'none'     → nadie comprometido al corredor/hora (no se puede confirmar).
   */
  async confirmDecision(
    corridorId: string,
    departureAt: Date,
    currentDriverId: string,
  ): Promise<{
    action: 'keep' | 'reassign' | 'none';
    currentDriverId: string;
    stillCommitted: boolean;
    chosenDriverId: string | null;
    best: ScoredDriver | null;
    candidateCount: number;
  }> {
    const preview = await this.previewAssignment(corridorId, departureAt);
    const stillCommitted = preview.ranked.some((r) => r.driverId === currentDriverId);

    let action: 'keep' | 'reassign' | 'none';
    let chosenDriverId: string | null;
    if (stillCommitted) {
      action = 'keep';
      chosenDriverId = currentDriverId;
    } else if (preview.best) {
      action = 'reassign';
      chosenDriverId = preview.best.driverId;
    } else {
      action = 'none';
      chosenDriverId = null;
    }

    return {
      action,
      currentDriverId,
      stillCommitted,
      chosenDriverId,
      best: preview.best,
      candidateCount: preview.count,
    };
  }

  /**
   * Deriva el corredor intercity de un viaje PUNTO-A-PUNTO (privado) desde sus
   * coordenadas: ciudad de origen + destino (centroides con buffer) →
   * `findCorridorForCities`. Devuelve null si es urbano o no cae en un corredor
   * definido (esos viajes NO usan el motor de agendas — van por realtime).
   */
  resolveCorridorForCoords(
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
  ): { corridorId: string; originCityId: string; destCityId: string } | null {
    if (
      !Number.isFinite(pickupLat) ||
      !Number.isFinite(pickupLng) ||
      !Number.isFinite(dropoffLat) ||
      !Number.isFinite(dropoffLng)
    ) {
      return null;
    }
    const o = resolveCityWithBuffer(pickupLat, pickupLng);
    const d = resolveCityWithBuffer(dropoffLat, dropoffLng);
    if (!o || !d || o.id === d.id) return null;
    const corridor = findCorridorForCities(o.id, d.id);
    if (!corridor) return null;
    return { corridorId: corridor.id, originCityId: o.id, destCityId: d.id };
  }

  /**
   * Reúne los candidatos (conductores comprometidos al corredor cerca de la
   * hora) con sus insumos de scoring. Devuelve null si el corredor es
   * desconocido; [] si no hay ningún conductor con agenda para esa ventana.
   */
  private async gatherCandidates(
    corridorId: string,
    scheduledAt: Date,
  ): Promise<DriverCandidate[] | null> {
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
    if (agendas.length === 0) return [];

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
    if (driverIds.length === 0) return [];

    // 3) Insumos del scoring: equidad (viajes del día) + rating.
    const [tripsToday, ratings] = await Promise.all([
      this.tripsTodayByDriver(driverIds, scheduledAt),
      this.avgRatings(driverIds),
    ]);

    return driverIds.map((id) => ({
      driverId: id,
      tripsToday: tripsToday[id] ?? 0,
      rating: ratings[id] ?? 4.5,
      distanceKm: null, // v1: proximidad inherente al corredor comprometido
      available: true, // v1: comprometido = disponible (refinar: online/no doble-booked)
    }));
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
