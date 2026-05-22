/**
 * Tests de la lógica pura del viaje compartido programado.
 */
import { CORRIDORS_BY_ID, getCarpoolSeating } from 'pricing';
import {
  resolveDirection,
  deriveTripSeedsForDate,
  evaluateSeatRequest,
  splitScheduleResults,
  canAttachParcel,
  type DriverAgenda,
} from './scheduled-trip.logic';

const sierraCentro = CORRIDORS_BY_ID['sierra_centro'];
const suv = getCarpoolSeating('suv')!;

describe('resolveDirection', () => {
  it('Ambato→Quito es ida (hacia Quito)', () => {
    expect(resolveDirection(sierraCentro, 'ambato', 'quito')).toBe('ida');
  });
  it('Quito→Ambato es vuelta', () => {
    expect(resolveDirection(sierraCentro, 'quito', 'ambato')).toBe('vuelta');
  });
  it('ciudad fuera del corredor → null', () => {
    expect(resolveDirection(sierraCentro, 'ibarra', 'quito')).toBeNull();
  });
});

describe('deriveTripSeedsForDate', () => {
  // Viernes 2026-05-22 (getDay = 5)
  const friday = new Date(2026, 4, 22, 0, 0, 0);

  const agendas: DriverAgenda[] = [
    {
      driverId: 'drv-1',
      slots: [{ routeId: 'sierra_centro', time: '08:30', days: [5], returnTrip: true }],
    },
    {
      driverId: 'drv-2',
      slots: [{ routeId: 'sierra_norte', time: '09:00', days: [5], returnTrip: false }],
    },
  ];

  it('genera ida + vuelta para el slot de sierra_centro del viernes', () => {
    const seeds = deriveTripSeedsForDate(agendas, sierraCentro, friday);
    // drv-1 hace sierra_centro con returnTrip → 2 seeds; drv-2 es otro corredor → 0
    expect(seeds).toHaveLength(2);
    const ida = seeds.find((s) => s.direction === 'ida')!;
    expect(ida.driverId).toBe('drv-1');
    expect(ida.originCity).toBe('riobamba');
    expect(ida.destinationCity).toBe('quito');
    expect(ida.seatsTotal).toBe(3); // SUV
    expect(ida.departureAt.getHours()).toBe(8);
    expect(ida.departureAt.getMinutes()).toBe(30);

    const vuelta = seeds.find((s) => s.direction === 'vuelta')!;
    expect(vuelta.originCity).toBe('quito');
    expect(vuelta.destinationCity).toBe('riobamba');
    // vuelta sale más tarde (08:30 + 2.5h + 1.5h margen = 12:30)
    expect(vuelta.departureAt.getTime()).toBeGreaterThan(ida.departureAt.getTime());
  });

  it('no genera nada si ningún slot cae en el día', () => {
    const monday = new Date(2026, 4, 25, 0, 0, 0); // getDay = 1
    expect(deriveTripSeedsForDate(agendas, sierraCentro, monday)).toHaveLength(0);
  });
});

describe('evaluateSeatRequest (reglas de asientos SUV)', () => {
  const base = {
    vehicleType: 'suv',
    seatsTotal: 3,
    seatsReserved: 0,
    groupSeatTaken: false,
    frontSeatTaken: false,
  };

  it('reserva individual de 1 asiento: ok', () => {
    const d = evaluateSeatRequest(base, { seats: 1 }, suv);
    expect(d.ok).toBe(true);
    expect(d.newSeatsReserved).toBe(1);
    expect(d.usedGroupSeat).toBe(false);
  });

  it('individual no puede tomar el 4º (centro) — solo grupo', () => {
    const d = evaluateSeatRequest({ ...base, seatsReserved: 3 }, { seats: 1 }, suv);
    expect(d.ok).toBe(false);
  });

  it('grupo de 4 usa el centro y deja el viaje lleno', () => {
    const d = evaluateSeatRequest(base, { seats: 4, isGroup: true }, suv);
    expect(d.ok).toBe(true);
    expect(d.usedGroupSeat).toBe(true);
    expect(d.status).toBe('full');
  });

  it('grupo de 5 excede la capacidad física → falla', () => {
    const d = evaluateSeatRequest(base, { seats: 5, isGroup: true }, suv);
    expect(d.ok).toBe(false);
  });

  it('delantero exclusivo libre → ok; ya tomado → falla', () => {
    expect(evaluateSeatRequest(base, { seats: 1, wantsFrontExclusive: true }, suv).ok).toBe(true);
    expect(
      evaluateSeatRequest(
        { ...base, frontSeatTaken: true },
        { seats: 1, wantsFrontExclusive: true },
        suv,
      ).ok,
    ).toBe(false);
  });
});

describe('canAttachParcel (carga en viaje programado)', () => {
  const base = {
    seatsTotal: 3,
    seatsReserved: 0,
    packagesOnboard: 0,
    packageSeatsConsumed: 0,
  };

  it('viaje vacío acepta bulto normal y sobre-volumen', () => {
    expect(canAttachParcel(base, false)).toBe(true);
    expect(canAttachParcel(base, true)).toBe(true);
  });

  it('al tope de bultos (3) rechaza', () => {
    expect(canAttachParcel({ ...base, packagesOnboard: 3 }, false)).toBe(false);
  });

  it('sobre-volumen necesita un asiento libre; el bulto normal no', () => {
    const full = { ...base, seatsReserved: 3 }; // SUV con pasajeros llenos
    expect(canAttachParcel(full, true)).toBe(false); // sobre-volumen sin asiento
    expect(canAttachParcel(full, false)).toBe(true); // normal va en cajuela
  });
});

describe('splitScheduleResults (cascada)', () => {
  const req = new Date(2026, 4, 22, 16, 0); // viernes 16:00

  it('hay salidas el mismo día → van en scheduledOptions, ordenadas por cercanía', () => {
    const options = [
      { departureAt: new Date(2026, 4, 22, 18, 0), availableSeats: 2, id: 'tarde' },
      { departureAt: new Date(2026, 4, 22, 15, 30), availableSeats: 1, id: 'cerca' },
    ];
    const r = splitScheduleResults(options, req);
    expect(r.scheduledOptions[0].id).toBe('cerca'); // 15:30 más cerca de 16:00 que 18:00
    expect(r.alternativeSchedules).toHaveLength(0);
  });

  it('sin cupo el mismo día → sugiere días adyacentes', () => {
    const options = [
      { departureAt: new Date(2026, 4, 22, 16, 0), availableSeats: 0, id: 'lleno' },
      { departureAt: new Date(2026, 4, 23, 9, 0), availableSeats: 3, id: 'mañana' },
    ];
    const r = splitScheduleResults(options, req);
    expect(r.scheduledOptions).toHaveLength(0);
    expect(r.alternativeSchedules).toHaveLength(1);
    expect(r.alternativeSchedules[0].recommendationReason).toBe('adjacent_day');
  });
});
