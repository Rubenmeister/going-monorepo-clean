/**
 * Tests de los builders de BookingOptionsScreen — verifican que los params
 * de navegación a ConfirmRide y ScheduledSeatReservation tienen el shape
 * y los valores correctos según el response del /search.
 */
import {
  buildConfirmRideFromOnDemand,
  buildSeatReservationParams,
} from './booking-options.builders';
import type {
  OnDemandOption,
  ScheduledOption,
  AlternativeSchedule,
} from '../../services/api';

describe('buildConfirmRideFromOnDemand', () => {
  const pickup = { latitude: -0.18, longitude: -78.47, address: 'Quito centro' };
  const destination = { latitude: -2.17, longitude: -79.92, address: 'Guayaquil' };
  const baseOpt: OnDemandOption = {
    serviceType:         'intercity_private_immediate',
    label:               'Privado SUV',
    description:         'Carro privado SUV',
    price:               45.5,
    currency:            'USD',
    estimatedEtaMinutes: 10,
    vehicleType:         'suv',
  };

  it('marca type=privado siempre (on-demand = ride-hailing)', () => {
    const out = buildConfirmRideFromOnDemand(baseOpt, pickup, destination);
    expect(out.type).toBe('privado');
  });

  it('copia coords pickup/destination correctamente', () => {
    const out = buildConfirmRideFromOnDemand(baseOpt, pickup, destination);
    expect(out.originCoords).toEqual({ lat: -0.18, lng: -78.47 });
    expect(out.destCoords).toEqual({ lat: -2.17, lng: -79.92 });
    expect(out.origin).toBe('Quito centro');
    expect(out.destination).toBe('Guayaquil');
  });

  it('usa label como fallback de origin/destination si no hay address', () => {
    const pickupNoAddress = { latitude: 0, longitude: 0 };
    const out = buildConfirmRideFromOnDemand(baseOpt, pickupNoAddress, destination);
    expect(out.origin).toBe('Origen');
  });

  it('calcula departureTime = now + ETA', () => {
    const fixedNow = new Date('2026-05-26T20:00:00Z');
    const out = buildConfirmRideFromOnDemand(baseOpt, pickup, destination, fixedNow);
    // ETA 10min → 20:10
    expect(out.departureTime).toBe('2026-05-26T20:10:00.000Z');
  });

  it('pasa totalPrice y vehicle del opt', () => {
    const out = buildConfirmRideFromOnDemand(baseOpt, pickup, destination);
    expect(out.totalPrice).toBe(45.5);
    expect(out.vehicleId).toBe('suv');
    expect(out.vehicle).toBe('suv');
  });

  it('cae a opt.label como vehicle si no hay vehicleType', () => {
    const noVehicle: OnDemandOption = { ...baseOpt, vehicleType: undefined };
    const out = buildConfirmRideFromOnDemand(noVehicle, pickup, destination);
    expect(out.vehicle).toBe('Privado SUV');
    expect(out.vehicleId).toBeUndefined();
  });
});

describe('buildSeatReservationParams', () => {
  const pickup = { latitude: -0.18, longitude: -78.47, address: 'Quito' };
  const destination = { latitude: -2.17, longitude: -79.92, address: 'Guayaquil' };
  const baseOpt: ScheduledOption = {
    scheduledTripId: 'trip-abc',
    driverId:        'drv-1',
    corridorId:      'qui-gye',
    routeLabel:      'Quito → Guayaquil',
    originCity:      'quito',
    destCity:        'guayaquil',
    departureTime:   '2026-05-27T14:00:00.000Z',
    availableSeats:  3,
    pricePerSeat:    15,
    vehicleModel:    'Toyota Hilux',
    driver:          { rating: 4.7 },
  };

  it('mapea todos los campos del scheduled option', () => {
    const out = buildSeatReservationParams(baseOpt, pickup, destination);
    expect(out.scheduledTripId).toBe('trip-abc');
    expect(out.originCity).toBe('quito');
    expect(out.destCity).toBe('guayaquil');
    expect(out.routeLabel).toBe('Quito → Guayaquil');
    expect(out.availableSeats).toBe(3);
    expect(out.pricePerSeat).toBe(15);
    expect(out.departureTime).toBe('2026-05-27T14:00:00.000Z');
    expect(out.vehicleModel).toBe('Toyota Hilux');
    expect(out.driver?.rating).toBe(4.7);
  });

  it('pasa pickup y destination tal cual', () => {
    const out = buildSeatReservationParams(baseOpt, pickup, destination);
    expect(out.pickup).toEqual(pickup);
    expect(out.destination).toEqual(destination);
  });

  it('funciona con AlternativeSchedule (extiende ScheduledOption)', () => {
    const alt: AlternativeSchedule = {
      ...baseOpt,
      recommendationReason: 'same_day_different_time',
    };
    const out = buildSeatReservationParams(alt, pickup, destination);
    expect(out.scheduledTripId).toBe('trip-abc');
    // recommendationReason no se propaga — la pantalla no lo necesita
    expect(out as any).not.toHaveProperty('recommendationReason');
  });

  it('preserva originCity/destCity (necesarios para reserve)', () => {
    const out = buildSeatReservationParams(baseOpt, pickup, destination);
    // Sin estos campos no podemos llamar POST /scheduled-trips/:id/reserve
    expect(out.originCity).toBeTruthy();
    expect(out.destCity).toBeTruthy();
  });
});
