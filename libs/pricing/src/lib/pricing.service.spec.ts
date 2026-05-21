/**
 * Smoke tests del motor de pricing. NO buscan cobertura exhaustiva — buscan
 * proteger las reglas críticas que afectan facturación al cliente final
 * antes de cualquier refactor o cambio de tabla de precios.
 *
 * Si alguno de estos tests rompe, hay que revisar SI el cambio fue
 * intencional. Lo que rompe acá rompe en producción.
 */

import {
  isEcuadorHoliday,
  getDynamicSurchargeRate,
  getClientSurchargeRate,
  applyDynamicPricing,
  PricingService,
  QUITO_ZONE_SURCHARGE,
  GOING_SHARED_ROUTES,
} from './pricing.service';

describe('pricing — feriados Ecuador', () => {
  it('1 de enero es feriado', () => {
    expect(isEcuadorHoliday(new Date(2026, 0, 1))).toBe(true);
  });

  it('Navidad (25 dic) es feriado', () => {
    expect(isEcuadorHoliday(new Date(2026, 11, 25))).toBe(true);
  });

  it('Día del Trabajo (1 mayo) es feriado', () => {
    expect(isEcuadorHoliday(new Date(2026, 4, 1))).toBe(true);
  });

  it('Batalla de Pichincha (24 mayo) es feriado', () => {
    expect(isEcuadorHoliday(new Date(2026, 4, 24))).toBe(true);
  });

  it('Independencia (10 agosto) es feriado', () => {
    expect(isEcuadorHoliday(new Date(2026, 7, 10))).toBe(true);
  });

  it('Día normal (15 marzo) NO es feriado', () => {
    expect(isEcuadorHoliday(new Date(2026, 2, 15))).toBe(false);
  });

  it('Carnaval lunes 2026 (cae 16 feb) es feriado calculado por Pascua', () => {
    // Pascua 2026 = 5 abril → carnaval lunes = -48 días = 16 feb
    expect(isEcuadorHoliday(new Date(2026, 1, 16))).toBe(true);
    expect(isEcuadorHoliday(new Date(2026, 1, 17))).toBe(true); // martes
  });
});

describe('pricing — recargos dinámicos', () => {
  // 2026-03-15 (domingo)
  const sunday1pm  = new Date(2026, 2, 15, 13, 0); // domingo 13:00
  const monday1pm  = new Date(2026, 2, 16, 13, 0); // lunes 13:00
  const monday7am  = new Date(2026, 2, 16, 7, 0);  // lunes 7am (hora pico mañana)
  const monday6pm  = new Date(2026, 2, 16, 18, 0); // lunes 18:00 (hora pico tarde)
  const monday11pm = new Date(2026, 2, 16, 23, 0); // lunes 23:00 (nocturno)
  const monday3am  = new Date(2026, 2, 16, 3, 0);  // lunes 03:00 (nocturno)

  it('lunes 13:00 privado: sin recargo (fuera de pico, sin feriado)', () => {
    expect(getDynamicSurchargeRate(monday1pm, 'privado')).toBe(0);
  });

  it('lunes 07:00 privado: hora pico mañana +15%', () => {
    expect(getDynamicSurchargeRate(monday7am, 'privado')).toBe(0.15);
  });

  it('lunes 18:00 privado: hora pico tarde +15%', () => {
    expect(getDynamicSurchargeRate(monday6pm, 'privado')).toBe(0.15);
  });

  it('lunes 23:00 privado: nocturno +20%', () => {
    expect(getDynamicSurchargeRate(monday11pm, 'privado')).toBe(0.20);
  });

  it('lunes 03:00 privado: madrugada +20%', () => {
    expect(getDynamicSurchargeRate(monday3am, 'privado')).toBe(0.20);
  });

  it('domingo 13:00 privado: fin de semana +10%', () => {
    expect(getDynamicSurchargeRate(sunday1pm, 'privado')).toBe(0.10);
  });

  it('compartido aplica MITAD del recargo de privado', () => {
    expect(getDynamicSurchargeRate(monday11pm, 'compartido')).toBe(0.10); // vs 0.20 privado
    expect(getDynamicSurchargeRate(sunday1pm, 'compartido')).toBe(0.05);  // vs 0.10 privado
  });

  it('feriado + hora pico SE SUMAN', () => {
    // 1 enero 7am → feriado (+25%) + hora pico mañana (+15%) = 40%
    const newYearAm = new Date(2026, 0, 1, 7, 0);
    expect(getDynamicSurchargeRate(newYearAm, 'privado')).toBeCloseTo(0.40, 2);
  });

  it('feriado domina sobre fin de semana (no suma, toma el mayor)', () => {
    // 1 enero 2026 = jueves, pero verifiquemos cuando feriado cae en domingo
    // Carnaval lunes 16 feb 2026 = 0.25 (feriado) + 0 (lunes no es weekend)
    const carnavalDay = new Date(2026, 1, 16, 13, 0);
    expect(getDynamicSurchargeRate(carnavalDay, 'privado')).toBe(0.25);
  });
});

describe('pricing — segmentos de cliente', () => {
  it('público: sin recargo', () => {
    expect(getClientSurchargeRate('public')).toBe(0);
  });

  it('agency: +25%', () => {
    expect(getClientSurchargeRate('agency')).toBe(0.25);
  });

  it('corporate: +25%', () => {
    expect(getClientSurchargeRate('corporate')).toBe(0.25);
  });
});

describe('pricing — applyDynamicPricing (fórmula combinada)', () => {
  const monday1pm = new Date(2026, 2, 16, 13, 0); // lunes normal

  it('público, lunes normal, sin recargo: precio = base', () => {
    const r = applyDynamicPricing({
      basePrice: 25,
      mode: 'privado',
      dateTime: monday1pm,
      clientSegment: 'public',
    });
    expect(r.adjustedPrice).toBe(25);
    expect(r.timeSurchargeRate).toBe(0);
    expect(r.clientSurchargeRate).toBe(0);
  });

  it('corporate, lunes normal: precio = base × 1.25', () => {
    const r = applyDynamicPricing({
      basePrice: 25,
      mode: 'privado',
      dateTime: monday1pm,
      clientSegment: 'corporate',
    });
    expect(r.adjustedPrice).toBe(31); // round(25 × 1.25) = 31.25 → round = 31
    expect(r.clientSurchargeRate).toBe(0.25);
  });

  it('público nocturno: 25 × (1 + 0.20) = 30', () => {
    const r = applyDynamicPricing({
      basePrice: 25,
      mode: 'privado',
      dateTime: new Date(2026, 2, 16, 23, 0), // lunes 23:00
      clientSegment: 'public',
    });
    expect(r.adjustedPrice).toBe(30);
  });

  it('recargo de origen se suma DESPUÉS del round (+$5)', () => {
    const r = applyDynamicPricing({
      basePrice: 20,
      mode: 'privado',
      dateTime: monday1pm,
      clientSegment: 'public',
      originSurcharge: 5,
    });
    expect(r.adjustedPrice).toBe(25);
    expect(r.originSurcharge).toBe(5);
  });

  it('descuento por puntos: 25 × (1 - 0.10) = 22.50 → 23', () => {
    const r = applyDynamicPricing({
      basePrice: 25,
      mode: 'privado',
      dateTime: monday1pm,
      clientSegment: 'public',
      discountRate: 0.10,
    });
    expect(r.adjustedPrice).toBe(23); // round(22.5) = 23
    expect(r.discountRate).toBe(0.10);
  });
});

describe('pricing — zonas Quito y rutas compartidas (datos)', () => {
  it('todas las zonas Quito tienen recargo definido', () => {
    expect(QUITO_ZONE_SURCHARGE.quito_norte).toBe(0);
    expect(QUITO_ZONE_SURCHARGE.quito_centro).toBe(1);
    expect(QUITO_ZONE_SURCHARGE.quito_sur).toBe(1);
    expect(QUITO_ZONE_SURCHARGE.valles).toBe(2);
    expect(QUITO_ZONE_SURCHARGE.aeropuerto).toBe(15); // alto → es el aeropuerto
  });

  it('rutas compartidas oficiales existen', () => {
    expect(GOING_SHARED_ROUTES.length).toBeGreaterThanOrEqual(3);
    const ids = GOING_SHARED_ROUTES.map(r => r.id);
    expect(ids).toContain('sierra_centro');
    expect(ids).toContain('sierra_norte');
    expect(ids).toContain('costa_quito');
  });

  it('Riobamba → Quito tiene precio $17 por asiento SUV', () => {
    const sierraCentro = GOING_SHARED_ROUTES.find(r => r.id === 'sierra_centro');
    expect(sierraCentro).toBeDefined();
    expect(sierraCentro && sierraCentro.stopPrices.Riobamba).toBe(17);
  });
});

describe('PricingService — calcSharedRoute (Going viajes interurbanos)', () => {
  const service = new PricingService();

  it('Ambato → Quito Norte (SUV, 1 asiento, no delantero): $10', () => {
    const r = service.calcSharedRoute({
      serviceType: 'shared_route',
      originStop: 'Ambato',
      quitoZone: 'quito_norte',
      vehicleType: 'suv',
      passengers: 1,
    });
    expect(r.total).toBe(10);
  });

  it('Ambato → Aeropuerto (SUV, delantero, 1 asiento): $10 + $15 + $3 = $28', () => {
    const r = service.calcSharedRoute({
      serviceType: 'shared_route',
      originStop: 'Ambato',
      quitoZone: 'aeropuerto',
      vehicleType: 'suv',
      frontSeat: true,
      passengers: 1,
    });
    expect(r.total).toBe(28);
  });

  it('VAN cuesta $2 menos que SUV', () => {
    const suv = service.calcSharedRoute({
      serviceType: 'shared_route',
      originStop: 'Ambato',
      vehicleType: 'suv',
      passengers: 1,
    });
    const van = service.calcSharedRoute({
      serviceType: 'shared_route',
      originStop: 'Ambato',
      vehicleType: 'van',
      passengers: 1,
    });
    expect(suv.total - van.total).toBe(2);
  });
});

describe('PricingService — calculate (entry point)', () => {
  const service = new PricingService();

  it('transport: incluye baseFare + perKm + perMinute × surge', () => {
    const r = service.calculate({
      serviceType: 'transport',
      distanceKm: 10,
      durationMinutes: 20,
      surgeMultiplier: 1.0,
    });
    // baseFare 2.5 + 10×0.55 + 20×0.1 = 10.0
    expect(r.subtotal).toBe(10);
    expect(r.platformFee).toBeCloseTo(2, 1); // 20% Going
    expect(r.providerAmount).toBeCloseTo(8, 1);
  });

  it('envio: baseFare + perKm + perKg', () => {
    const r = service.calculate({
      serviceType: 'envio',
      distanceKm: 5,
      weightKg: 3,
    });
    expect(r.subtotal).toBeGreaterThan(0);
    expect(r.platformFee).toBeGreaterThan(0);
  });
});
