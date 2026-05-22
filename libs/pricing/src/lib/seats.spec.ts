/**
 * Tests del precio de asientos de carpooling (calcCarpoolSeats) y la config.
 * Precio por asiento = FARES (cotización = cobro). El centro de grupo va al
 * mismo precio; el delantero exclusivo suma su recargo una sola vez.
 */
import { PricingService } from './pricing.service';
import { CARPOOL_SEATING, getCarpoolSeating, maxCarpoolCapacity } from './seats';

describe('seats — config de carpooling', () => {
  it('SUV: 3 públicos + 1 de grupo, delantero +$3', () => {
    expect(CARPOOL_SEATING.suv.publicSeats).toBe(3);
    expect(CARPOOL_SEATING.suv.groupExtraSeats).toBe(1);
    expect(CARPOOL_SEATING.suv.frontSeatSurcharge).toBe(3);
    expect(maxCarpoolCapacity('suv')).toBe(4);
  });

  it('SUV XL: 4 públicos', () => {
    expect(CARPOOL_SEATING.suv_xl.publicSeats).toBe(4);
    expect(maxCarpoolCapacity('suv_xl')).toBe(5);
  });

  it('vehículo no-carpool devuelve null', () => {
    expect(getCarpoolSeating('van')).toBeNull();
  });
});

describe('PricingService — calcCarpoolSeats', () => {
  const svc = new PricingService();

  it('Ambato→Quito, 1 asiento SUV = $15 (FARES)', () => {
    const r = svc.calcCarpoolSeats({
      originCity: 'ambato',
      destCity: 'quito',
      vehicleType: 'suv',
      seats: 1,
    });
    expect(r.perSeat).toBe(15);
    expect(r.total).toBe(15);
  });

  it('3 asientos = 3 × precio (mismo costo el del centro de grupo)', () => {
    const r = svc.calcCarpoolSeats({
      originCity: 'ambato',
      destCity: 'quito',
      vehicleType: 'suv',
      seats: 3,
    });
    expect(r.total).toBe(45);
  });

  it('grupo de 4 (incluye centro) = 4 × precio, sin recargo por el centro', () => {
    const r = svc.calcCarpoolSeats({
      originCity: 'ambato',
      destCity: 'quito',
      vehicleType: 'suv',
      seats: 4,
    });
    expect(r.total).toBe(60);
  });

  it('delantero exclusivo agrega +$3 una sola vez', () => {
    const r = svc.calcCarpoolSeats({
      originCity: 'ambato',
      destCity: 'quito',
      vehicleType: 'suv',
      seats: 1,
      frontExclusive: true,
    });
    expect(r.frontSurcharge).toBe(3);
    expect(r.total).toBe(18);
  });

  it('Riobamba→Quito = $17/asiento', () => {
    const r = svc.calcCarpoolSeats({
      originCity: 'riobamba',
      destCity: 'quito',
      vehicleType: 'suv',
      seats: 2,
    });
    expect(r.perSeat).toBe(17);
    expect(r.total).toBe(34);
  });
});
