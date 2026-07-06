import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PricingService,
  getFare,
  getCity,
  getCarpoolSeating,
  CORRIDORS_BY_ID,
} from 'pricing';
import {
  ScheduledTripModel,
  ScheduledTripDocument,
} from '../infrastructure/persistence/schemas/scheduled-trip.schema';
import {
  DriverScheduleModel,
} from '../api/driver-schedule.controller';
import {
  corridorBetween,
  resolveDirection,
  deriveTripSeedsForDate,
  evaluateSeatRequest,
  splitScheduleResults,
  stopOffsetHours,
  canAttachParcel,
  type Direction,
  type DriverAgenda,
} from './scheduled-trip.logic';
import type {
  ScheduledOption,
  AlternativeSchedule,
} from '../api/dtos/search-query.dto';
import { PricingClient } from '../infrastructure/pricing-client';

export interface ReserveSeatInput {
  userId: string;
  originCity: string;
  destCity: string;
  seats: number;
  isGroup?: boolean;
  wantsFrontExclusive?: boolean;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const label = (cityId: string) => getCity(cityId)?.label ?? cityId;
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

/**
 * ScheduledTripService — inventario de viajes compartidos programados.
 *
 * Las salidas se materializan desde la agenda del conductor (driver_schedules):
 * el conductor está asignado a una ruta+hora y se le llenan los asientos con
 * pasajeros que coinciden. El precio por asiento es por tramo del pasajero
 * (FARES origen→destino), no del corredor completo.
 */
@Injectable()
export class ScheduledTripService {
  private readonly logger = new Logger(ScheduledTripService.name);

  constructor(
    @InjectModel(ScheduledTripModel.name)
    private readonly tripModel: Model<ScheduledTripDocument>,
    @InjectModel(DriverScheduleModel.name)
    private readonly scheduleModel: Model<any>,
    // Registrado en InfrastructureModule como 'DriverRatingModel' (driver.controller).
    // Inyectado por string para no importar el controller (arrastra tipos de Multer).
    @InjectModel('DriverRatingModel')
    private readonly ratingModel: Model<any>,
    private readonly pricing: PricingService,
    private readonly pricingClient: PricingClient,
  ) {}

  /**
   * Materializa (idempotente) las salidas de un corredor para una fecha desde
   * las agendas de los conductores. El índice único (driver, corridor, salida)
   * evita duplicados; $setOnInsert no pisa reservas existentes.
   */
  async materializeForDate(corridorId: string, date: Date): Promise<void> {
    const realCorridor = this.corridorById(corridorId);
    if (!realCorridor) return;

    const agendas = (await this.scheduleModel
      .find({ 'slots.routeId': corridorId })
      .lean()) as unknown as Array<{
      driverId: string;
      slots: any[];
      vehicleType?: string;
    }>;

    const seeds = deriveTripSeedsForDate(
      agendas.map<DriverAgenda>((a) => ({
        driverId: a.driverId,
        slots: a.slots,
        vehicleType: a.vehicleType,
      })),
      realCorridor,
      date,
    );

    for (const seed of seeds) {
      const pricePerSeat = getFare(seed.originCity, seed.destinationCity) ?? 0;
      try {
        await this.tripModel.updateOne(
          {
            driverId: seed.driverId,
            corridorId: seed.corridorId,
            departureAt: seed.departureAt,
          },
          {
            $setOnInsert: {
              driverId: seed.driverId,
              corridorId: seed.corridorId,
              originCity: seed.originCity,
              destinationCity: seed.destinationCity,
              departureAt: seed.departureAt,
              vehicleType: seed.vehicleType,
              seatsTotal: seed.seatsTotal,
              seatsReserved: 0,
              groupSeatTaken: false,
              frontSeatTaken: false,
              pricePerSeat,
              status: 'open',
            },
          },
          { upsert: true },
        );
      } catch (e: any) {
        // E11000: dos búsquedas concurrentes materializaron la misma salida.
        // Es benigno — la salida ya existe; ignoramos el duplicado.
        if (e?.code !== 11000) throw e;
      }
    }
  }

  /**
   * Busca cupos para el tramo del pasajero en la fecha pedida; si no hay cupo
   * ese día, devuelve sugerencias de días adyacentes.
   */
  async findOptions(
    originCity: string,
    destCity: string,
    requestedAt: Date,
  ): Promise<{
    scheduledOptions: ScheduledOption[];
    alternativeSchedules: AlternativeSchedule[];
  }> {
    const corridor = corridorBetween(originCity, destCity);
    const direction = corridor && resolveDirection(corridor, originCity, destCity);
    if (!corridor || !direction) {
      return { scheduledOptions: [], alternativeSchedules: [] };
    }

    // Materializa la fecha pedida y los días adyacentes (para la cascada).
    for (const offset of [-1, 0, 1]) {
      await this.materializeForDate(
        corridor.id,
        new Date(requestedAt.getTime() + offset * ONE_DAY_MS),
      );
    }

    const trips = (await this.tripModel
      .find({
        corridorId: corridor.id,
        status: 'open',
        departureAt: {
          $gte: startOfDay(new Date(requestedAt.getTime() - ONE_DAY_MS)),
          $lte: endOfDay(new Date(requestedAt.getTime() + ONE_DAY_MS)),
        },
      })
      .lean()) as any[];

    // F2: precio por asiento del motor de tarifas (editable en vivo), fallback local.
    const perSeat =
      (await this.pricingClient.sharedFare(originCity, destCity, () => getFare(originCity, destCity))) ?? 0;
    const routeLabel = `${label(originCity)} → ${label(destCity)}`;
    // Desfase hasta la parada de abordaje del pasajero (parada intermedia).
    const offsetMs =
      stopOffsetHours(corridor, originCity, direction) * 60 * 60 * 1000;

    const base = trips
      .filter((t) => this.tripDirection(t) === direction)
      .map((t) => {
        const boarding = new Date(new Date(t.departureAt).getTime() + offsetMs);
        return {
          scheduledTripId: t._id.toString(),
          driverId: t.driverId,
          corridorId: corridor.id,
          routeLabel,
          // originCity / destCity normalizados (claves FARES) — necesarios
          // para que el cliente pueda llamar POST /scheduled-trips/:id/reserve
          // sin tener que parsear el routeLabel. Sin estos, mobile no podía
          // completar la reserva del scheduled.
          originCity,
          destCity,
          departureAt: boarding,
          departureTime: boarding.toISOString(),
          availableSeats: Math.max(0, t.seatsTotal - t.seatsReserved),
          pricePerSeat: perSeat,
          vehicleModel: t.vehicleType,
        };
      });

    // Rating del conductor (promedio local). El nombre vendrá del perfil
    // (user-auth) en una integración posterior.
    const ratingMap = await this.avgRatings([
      ...new Set(base.map((o) => o.driverId)),
    ]);
    const options = base.map((o) => ({
      ...o,
      driver:
        ratingMap[o.driverId] != null
          ? { rating: Math.round(ratingMap[o.driverId] * 10) / 10 }
          : undefined,
    }));

    const { scheduledOptions, alternativeSchedules } = splitScheduleResults(
      options,
      requestedAt,
    );
    return {
      scheduledOptions: scheduledOptions as unknown as ScheduledOption[],
      alternativeSchedules: alternativeSchedules as unknown as AlternativeSchedule[],
    };
  }

  /** Reserva asiento(s) en un viaje, con bloqueo optimista anti-sobreventa. */
  async reserveSeat(tripId: string, input: ReserveSeatInput) {
    const trip = await this.tripModel.findById(tripId).lean();
    if (!trip) throw new NotFoundException(`Viaje ${tripId} no existe`);
    if (trip.status !== 'open') {
      throw new ConflictException('El viaje ya no admite reservas');
    }
    const seating = getCarpoolSeating(trip.vehicleType);
    if (!seating) {
      throw new BadRequestException(
        `Vehículo ${trip.vehicleType} no opera viaje compartido`,
      );
    }

    const decision = evaluateSeatRequest(
      {
        vehicleType: trip.vehicleType,
        seatsTotal: trip.seatsTotal,
        seatsReserved: trip.seatsReserved,
        groupSeatTaken: trip.groupSeatTaken,
        frontSeatTaken: trip.frontSeatTaken,
      },
      {
        seats: input.seats,
        isGroup: input.isGroup,
        wantsFrontExclusive: input.wantsFrontExclusive,
      },
      seating,
    );
    if (!decision.ok) throw new ConflictException(decision.reason);

    // Precio por asiento desde el MOTOR (fuente única, editable en vivo). Si el
    // motor está caído cae a la tabla local. Sin esto, la reserva cobraría el
    // bundle y divergiría de lo que `/search` mostró (leído también del motor).
    const motorPerSeat = await this.pricingClient.sharedFare(
      input.originCity,
      input.destCity,
      () => getFare(input.originCity, input.destCity),
    );
    const price = this.pricing.calcCarpoolSeats({
      originCity: input.originCity,
      destCity: input.destCity,
      vehicleType: trip.vehicleType as 'suv' | 'suv_xl',
      seats: input.seats,
      frontExclusive: input.wantsFrontExclusive,
      perSeat: motorPerSeat ?? undefined,
    });

    // Bloqueo optimista: solo actualiza si seatsReserved no cambió desde la lectura.
    const updated = await this.tripModel.findOneAndUpdate(
      { _id: tripId, status: 'open', seatsReserved: trip.seatsReserved },
      {
        $set: {
          seatsReserved: decision.newSeatsReserved,
          groupSeatTaken: decision.newGroupSeatTaken,
          frontSeatTaken: decision.newFrontSeatTaken,
          status: decision.status,
        },
        $push: {
          reservations: {
            userId: input.userId,
            seats: input.seats,
            frontExclusive: !!input.wantsFrontExclusive,
            usedGroupSeat: decision.usedGroupSeat,
            pricePaid: price.total,
            createdAt: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!updated) {
      throw new ConflictException(
        'Los asientos cambiaron mientras reservabas, intenta de nuevo',
      );
    }

    return {
      tripId,
      seatsReserved: updated.seatsReserved,
      seatsTotal: updated.seatsTotal,
      status: updated.status,
      price,
    };
  }

  /**
   * Adjunta un envío interurbano a la salida programada más próxima del
   * corredor que tenga cupo de carga. El paquete viaja con ese conductor.
   * Sobre-volumen consume 1 asiento. Devuelve el viaje/conductor asignado, o
   * { attached: false } si no hay salida con cupo (el caller hace fallback a
   * despacho on-demand).
   */
  async attachParcel(input: {
    originCity: string;
    destCity: string;
    requestedAt: Date;
    isOverVolume?: boolean;
  }): Promise<{
    attached: boolean;
    scheduledTripId?: string;
    driverId?: string;
    departureAt?: string;
  }> {
    const corridor = corridorBetween(input.originCity, input.destCity);
    const direction =
      corridor && resolveDirection(corridor, input.originCity, input.destCity);
    if (!corridor || !direction) return { attached: false };

    for (const offset of [0, 1]) {
      await this.materializeForDate(
        corridor.id,
        new Date(input.requestedAt.getTime() + offset * ONE_DAY_MS),
      );
    }

    // Salidas abiertas del corredor desde la hora pedida, la más próxima primero.
    const trips = (await this.tripModel
      .find({
        corridorId: corridor.id,
        status: 'open',
        departureAt: { $gte: input.requestedAt },
      })
      .sort({ departureAt: 1 })
      .lean()) as any[];

    for (const t of trips) {
      if (this.tripDirection(t) !== direction) continue;
      const fits = canAttachParcel(
        {
          seatsTotal: t.seatsTotal,
          seatsReserved: t.seatsReserved,
          packagesOnboard: t.packagesOnboard ?? 0,
          packageSeatsConsumed: t.packageSeatsConsumed ?? 0,
        },
        !!input.isOverVolume,
      );
      if (!fits) continue;

      // Bloqueo optimista: solo adjunta si packagesOnboard no cambió.
      const updated = await this.tripModel.findOneAndUpdate(
        { _id: t._id, status: 'open', packagesOnboard: t.packagesOnboard ?? 0 },
        {
          $inc: {
            packagesOnboard: 1,
            packageSeatsConsumed: input.isOverVolume ? 1 : 0,
          },
        },
        { new: true },
      );
      if (updated) {
        return {
          attached: true,
          scheduledTripId: t._id.toString(),
          driverId: t.driverId,
          departureAt: new Date(t.departureAt).toISOString(),
        };
      }
    }
    return { attached: false };
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  /** Promedio de calificación por conductor (driver_ratings). */
  private async avgRatings(
    driverIds: string[],
  ): Promise<Record<string, number>> {
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
      this.logger.warn(`No se pudieron agregar ratings: ${(e as Error).message}`);
      return {};
    }
  }

  private corridorById(corridorId: string) {
    // Catálogo autoritativo en libs/pricing (corridors.ts). Antes esto tenía un
    // mapa hardcodeado de 3 corredores que se quedaba corto al agregar rutas
    // (p.ej. los corredores de aeropuerto). Ahora resuelve cualquier corredor.
    return CORRIDORS_BY_ID[corridorId] ?? null;
  }

  private tripDirection(trip: {
    originCity: string;
    destinationCity: string;
  }): Direction | null {
    const corridor = corridorBetween(trip.originCity, trip.destinationCity);
    if (!corridor) return null;
    return resolveDirection(corridor, trip.originCity, trip.destinationCity);
  }
}
