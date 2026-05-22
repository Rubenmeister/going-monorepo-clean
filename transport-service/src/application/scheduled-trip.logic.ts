import {
  findCorridorForCities,
  getCarpoolSeating,
  type Corridor,
  type CarpoolSeatConfig,
} from 'pricing';

/**
 * Lógica PURA del viaje compartido programado (sin Mongo, testeable).
 *
 * Cubre: dirección de ruta, materialización de salidas desde la agenda del
 * conductor, reglas de asientos (SUV 3 + centro de grupo + delantero exclusivo)
 * y la cascada de sugerencias cuando no hay cupo en la fecha pedida.
 */

export type Direction = 'ida' | 'vuelta';

export interface AgendaSlot {
  routeId: string;
  time: string; // "08:30"
  days: number[]; // 0=Dom … 6=Sab
  returnTrip: boolean;
}

export interface DriverAgenda {
  driverId: string;
  slots: AgendaSlot[];
  vehicleType?: string; // si la agenda no lo trae, default 'suv'
}

export interface TripSeed {
  driverId: string;
  corridorId: string;
  direction: Direction;
  originCity: string; // extremos del corredor para esa dirección
  destinationCity: string;
  departureAt: Date;
  vehicleType: string;
  seatsTotal: number;
}

/**
 * Dirección del viaje según el orden del corredor (Quito siempre es el último
 * stop). origen antes que destino → 'ida' (hacia Quito); al revés → 'vuelta'.
 */
export function resolveDirection(
  corridor: Corridor,
  originCityId: string,
  destCityId: string,
): Direction | null {
  const oi = corridor.stopCityIds.indexOf(originCityId);
  const di = corridor.stopCityIds.indexOf(destCityId);
  if (oi === -1 || di === -1 || oi === di) return null;
  return oi < di ? 'ida' : 'vuelta';
}

export function corridorBetween(
  originCityId: string,
  destCityId: string,
): Corridor | null {
  return findCorridorForCities(originCityId, destCityId);
}

/** Construye un Date en la fecha dada a partir de "HH:MM" + offset de horas. */
export function atTime(date: Date, time: string, addHours = 0): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  if (addHours) d.setTime(d.getTime() + addHours * 60 * 60 * 1000);
  return d;
}

function sameYMD(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Genera las salidas (seeds) que un conjunto de agendas produce para un
 * corredor en una fecha concreta. Por cada slot que cae en el día:
 *   - salida 'ida' a la hora del slot,
 *   - salida 'vuelta' (si returnTrip) a hora + duración + 1.5h de margen.
 */
export function deriveTripSeedsForDate(
  agendas: DriverAgenda[],
  corridor: Corridor,
  date: Date,
  defaultVehicle = 'suv',
): TripSeed[] {
  const weekday = date.getDay();
  const firstStop = corridor.stopCityIds[0];
  const lastStop = corridor.stopCityIds[corridor.stopCityIds.length - 1]; // quito
  const seeds: TripSeed[] = [];

  for (const agenda of agendas) {
    const vehicleType = agenda.vehicleType ?? defaultVehicle;
    const seating = getCarpoolSeating(vehicleType);
    const seatsTotal = seating?.publicSeats ?? 3;

    for (const slot of agenda.slots) {
      if (slot.routeId !== corridor.id) continue;
      if (!slot.days.includes(weekday)) continue;

      // Ida (hacia Quito)
      seeds.push({
        driverId: agenda.driverId,
        corridorId: corridor.id,
        direction: 'ida',
        originCity: firstStop,
        destinationCity: lastStop,
        departureAt: atTime(date, slot.time),
        vehicleType,
        seatsTotal,
      });

      // Vuelta (desde Quito), si el conductor la hace
      if (slot.returnTrip) {
        seeds.push({
          driverId: agenda.driverId,
          corridorId: corridor.id,
          direction: 'vuelta',
          originCity: lastStop,
          destinationCity: firstStop,
          departureAt: atTime(date, slot.time, corridor.estimatedDurationH + 1.5),
          vehicleType,
          seatsTotal,
        });
      }
    }
  }
  return seeds;
}

/**
 * Horas de desfase entre la salida del corredor y el momento en que el viaje
 * pasa por la parada del pasajero. Permite mostrar la hora real de abordaje en
 * una parada intermedia (ej. el viaje sale 08:30 de Riobamba pero pasa por
 * Ambato ~09:20). Reparte la duración total entre los tramos del corredor.
 */
export function stopOffsetHours(
  corridor: Corridor,
  cityId: string,
  direction: Direction,
): number {
  const stops = corridor.stopCityIds;
  const idx = stops.indexOf(cityId);
  if (idx < 0 || stops.length < 2) return 0;
  const perSegment = corridor.estimatedDurationH / (stops.length - 1);
  // 'ida' avanza desde stops[0]; 'vuelta' desde el último (Quito).
  const segmentsFromStart = direction === 'ida' ? idx : stops.length - 1 - idx;
  return segmentsFromStart * perSegment;
}

// ── Reglas de asientos ─────────────────────────────────────────────────────

export interface SeatState {
  vehicleType: string;
  seatsTotal: number; // públicos (3 SUV / 4 SUV XL)
  seatsReserved: number; // públicos + grupo ya ocupados
  groupSeatTaken: boolean;
  frontSeatTaken: boolean;
}

export interface SeatRequest {
  seats: number;
  isGroup?: boolean; // familia/amigos → habilita el centro trasero
  wantsFrontExclusive?: boolean;
}

export interface SeatDecision {
  ok: boolean;
  reason?: string;
  newSeatsReserved: number;
  newGroupSeatTaken: boolean;
  newFrontSeatTaken: boolean;
  usedGroupSeat: boolean;
  status: 'open' | 'full';
}

/**
 * Evalúa si una reserva de asientos cabe, aplicando las reglas:
 *   - reserva individual/desconocida: solo asientos públicos.
 *   - reserva de grupo: puede usar además el centro trasero (mismo precio).
 *   - delantero exclusivo: solo si nadie más lo tomó.
 */
export function evaluateSeatRequest(
  state: SeatState,
  req: SeatRequest,
  seating: CarpoolSeatConfig,
): SeatDecision {
  const fail = (reason: string): SeatDecision => ({
    ok: false,
    reason,
    newSeatsReserved: state.seatsReserved,
    newGroupSeatTaken: state.groupSeatTaken,
    newFrontSeatTaken: state.frontSeatTaken,
    usedGroupSeat: false,
    status: state.seatsReserved >= state.seatsTotal + seating.groupExtraSeats ? 'full' : 'open',
  });

  if (req.seats <= 0) return fail('Número de asientos inválido.');

  const physicalMax = state.seatsTotal + seating.groupExtraSeats;
  const cap = req.isGroup ? physicalMax : state.seatsTotal;
  if (state.seatsReserved + req.seats > cap) {
    return fail(
      req.isGroup
        ? 'No hay suficientes asientos disponibles (incluido el del centro).'
        : 'No hay suficientes asientos. El asiento del centro solo se habilita reservando como grupo.',
    );
  }
  if (req.wantsFrontExclusive && state.frontSeatTaken) {
    return fail('El asiento delantero ya está reservado.');
  }

  const newSeatsReserved = state.seatsReserved + req.seats;
  const usedGroupSeat = newSeatsReserved > state.seatsTotal;
  return {
    ok: true,
    newSeatsReserved,
    newGroupSeatTaken: state.groupSeatTaken || usedGroupSeat,
    newFrontSeatTaken: state.frontSeatTaken || !!req.wantsFrontExclusive,
    usedGroupSeat,
    status: newSeatsReserved >= physicalMax ? 'full' : 'open',
  };
}

// ── Cascada de sugerencias ──────────────────────────────────────────────────

export interface DepartureLite {
  departureAt: Date;
  availableSeats: number;
  [k: string]: unknown;
}

/**
 * Separa las opciones en: las del MISMO día (ordenadas por cercanía a la hora
 * pedida) y, solo si no hay ninguna con cupo ese día, las de días adyacentes
 * (±1 día) como sugerencias proactivas.
 */
export function splitScheduleResults<T extends DepartureLite>(
  options: T[],
  requestedAt: Date,
): { scheduledOptions: T[]; alternativeSchedules: (T & { recommendationReason: string })[] } {
  const byCloseness = (a: T, b: T) =>
    Math.abs(a.departureAt.getTime() - requestedAt.getTime()) -
    Math.abs(b.departureAt.getTime() - requestedAt.getTime());

  const withSeats = options.filter((o) => o.availableSeats > 0);
  const sameDay = withSeats
    .filter((o) => sameYMD(o.departureAt, requestedAt))
    .sort(byCloseness);

  if (sameDay.length > 0) {
    return { scheduledOptions: sameDay, alternativeSchedules: [] };
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const adjacent = withSeats
    .filter((o) => {
      const diff = Math.abs(o.departureAt.getTime() - requestedAt.getTime());
      return diff <= 2 * oneDayMs && !sameYMD(o.departureAt, requestedAt);
    })
    .sort(byCloseness)
    .map((o) => ({ ...o, recommendationReason: 'adjacent_day' as const }));

  return { scheduledOptions: [], alternativeSchedules: adjacent };
}
