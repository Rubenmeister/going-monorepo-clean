/**
 * Smoke test del ScheduledTripService con modelos Mongoose mockeados (mismo
 * patrón que mongo-ride-match.repository.spec). Valida la construcción de
 * queries, el precio por tramo, la materialización desde agenda, la cascada y
 * las reglas de reserva (sobreventa y bloqueo optimista).
 *
 * No usa una DB real; un e2e contra Mongo es un paso aparte.
 */
import { PricingService } from 'pricing';
import { ScheduledTripService } from './scheduled-trip.service';

function leanReturning(value: any) {
  return { lean: () => Promise.resolve(value) };
}

describe('ScheduledTripService', () => {
  let tripModel: any;
  let scheduleModel: any;
  let ratingModel: any;
  let service: ScheduledTripService;

  beforeEach(() => {
    tripModel = {
      updateOne: jest.fn().mockResolvedValue({}),
      find: jest.fn(),
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    scheduleModel = { find: jest.fn() };
    ratingModel = { aggregate: jest.fn().mockResolvedValue([]) };
    service = new ScheduledTripService(
      tripModel,
      scheduleModel,
      ratingModel,
      new PricingService(),
    );
  });

  describe('materializeForDate', () => {
    it('crea ida + vuelta desde la agenda, con asientos y precio de corredor', async () => {
      scheduleModel.find.mockReturnValue(
        leanReturning([
          {
            driverId: 'd1',
            slots: [{ routeId: 'sierra_centro', time: '08:30', days: [5], returnTrip: true }],
            vehicleType: 'suv',
          },
        ]),
      );
      const friday = new Date(2026, 4, 22); // getDay = 5

      await service.materializeForDate('sierra_centro', friday);

      expect(tripModel.updateOne).toHaveBeenCalledTimes(2); // ida + vuelta
      const ida = tripModel.updateOne.mock.calls.find(
        (c: any[]) => c[1].$setOnInsert.originCity === 'riobamba',
      );
      expect(ida[1].$setOnInsert.destinationCity).toBe('quito');
      expect(ida[1].$setOnInsert.seatsTotal).toBe(3); // SUV
      expect(ida[1].$setOnInsert.pricePerSeat).toBe(17); // riobamba→quito
    });
  });

  describe('findOptions', () => {
    beforeEach(() => {
      scheduleModel.find.mockReturnValue(leanReturning([])); // sin agendas extra
    });

    it('precio por tramo del pasajero + asientos + rating + hora de abordaje', async () => {
      tripModel.find.mockReturnValue(
        leanReturning([
          {
            _id: 't1',
            driverId: 'd1',
            corridorId: 'sierra_centro',
            originCity: 'riobamba',
            destinationCity: 'quito',
            departureAt: new Date(2026, 4, 22, 8, 30),
            vehicleType: 'suv',
            seatsTotal: 3,
            seatsReserved: 1,
          },
        ]),
      );
      ratingModel.aggregate.mockResolvedValue([{ _id: 'd1', avg: 4.6 }]);

      const res = await service.findOptions('ambato', 'quito', new Date(2026, 4, 22, 9, 0));

      expect(res.scheduledOptions).toHaveLength(1);
      const o = res.scheduledOptions[0];
      expect(o.pricePerSeat).toBe(15); // Ambato→Quito (tramo), no Riobamba→Quito
      expect(o.availableSeats).toBe(2); // 3 - 1
      expect(o.driver?.rating).toBe(4.6);
      // 08:30 + ~50min (Ambato es la 2ª parada) ≈ 09:20
      expect(new Date(o.departureTime).getHours()).toBe(9);
    });

    it('sin cupo el mismo día → sugiere el día adyacente', async () => {
      tripModel.find.mockReturnValue(
        leanReturning([
          {
            _id: 'full',
            driverId: 'd1',
            corridorId: 'sierra_centro',
            originCity: 'riobamba',
            destinationCity: 'quito',
            departureAt: new Date(2026, 4, 22, 8, 30),
            vehicleType: 'suv',
            seatsTotal: 3,
            seatsReserved: 3, // lleno
          },
          {
            _id: 'next',
            driverId: 'd2',
            corridorId: 'sierra_centro',
            originCity: 'riobamba',
            destinationCity: 'quito',
            departureAt: new Date(2026, 4, 23, 8, 30), // día siguiente
            vehicleType: 'suv',
            seatsTotal: 3,
            seatsReserved: 0,
          },
        ]),
      );

      const res = await service.findOptions('ambato', 'quito', new Date(2026, 4, 22, 9, 0));

      expect(res.scheduledOptions).toHaveLength(0);
      expect(res.alternativeSchedules).toHaveLength(1);
      expect(res.alternativeSchedules[0].recommendationReason).toBe('adjacent_day');
    });
  });

  describe('reserveSeat', () => {
    const openTrip = {
      _id: 't1',
      vehicleType: 'suv',
      seatsTotal: 3,
      seatsReserved: 0,
      groupSeatTaken: false,
      frontSeatTaken: false,
      status: 'open',
    };

    it('reserva 1 asiento Ambato→Quito = $15 y persiste', async () => {
      tripModel.findById.mockReturnValue(leanReturning({ ...openTrip }));
      tripModel.findOneAndUpdate.mockResolvedValue({
        seatsReserved: 1,
        seatsTotal: 3,
        status: 'open',
      });

      const r = await service.reserveSeat('t1', {
        userId: 'u1',
        originCity: 'ambato',
        destCity: 'quito',
        seats: 1,
      });

      expect(r.price.total).toBe(15);
      expect(tripModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('4 asientos sin grupo en SUV → rechaza (solo 3 públicos)', async () => {
      tripModel.findById.mockReturnValue(leanReturning({ ...openTrip }));
      await expect(
        service.reserveSeat('t1', {
          userId: 'u1',
          originCity: 'ambato',
          destCity: 'quito',
          seats: 4,
        }),
      ).rejects.toThrow();
      expect(tripModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('bloqueo optimista: si los asientos cambiaron, rechaza', async () => {
      tripModel.findById.mockReturnValue(leanReturning({ ...openTrip }));
      tripModel.findOneAndUpdate.mockResolvedValue(null); // otro reservó primero

      await expect(
        service.reserveSeat('t1', {
          userId: 'u1',
          originCity: 'ambato',
          destCity: 'quito',
          seats: 1,
        }),
      ).rejects.toThrow();
    });
  });
});
