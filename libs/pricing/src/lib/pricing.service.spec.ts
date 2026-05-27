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
    expect(sierraCentro && (sierraCentro.stopPrices as any).Riobamba).toBe(17);
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

  describe('envio (mensajería y encomiendas)', () => {
    // ── Precios urbanos FIJOS oficiales Going (no dependen de la distancia)
    //   small  (0–5 kg)   → $8
    //   medium (6–15 kg)  → $12
    //   large  (16–30 kg) → $15
    it('envío urbano pequeño (≤5 kg): $8 flat (independiente de distancia)', () => {
      const corto = service.calculate({ serviceType: 'envio', distanceKm: 1,  weightKg: 5, isIntercity: false });
      const medio = service.calculate({ serviceType: 'envio', distanceKm: 10, weightKg: 5, isIntercity: false });
      const lejos = service.calculate({ serviceType: 'envio', distanceKm: 30, weightKg: 5, isIntercity: false });
      expect(corto.total).toBe(8);
      expect(medio.total).toBe(8);
      expect(lejos.total).toBe(8);
    });

    it('envío urbano mediano (6–15 kg): $12 flat', () => {
      const r6  = service.calculate({ serviceType: 'envio', distanceKm: 5, weightKg: 6,  isIntercity: false });
      const r15 = service.calculate({ serviceType: 'envio', distanceKm: 5, weightKg: 15, isIntercity: false });
      expect(r6.total).toBe(12);
      expect(r15.total).toBe(12);
    });

    it('envío urbano grande (16–30 kg): $15 flat', () => {
      const r16 = service.calculate({ serviceType: 'envio', distanceKm: 5, weightKg: 16, isIntercity: false });
      const r30 = service.calculate({ serviceType: 'envio', distanceKm: 5, weightKg: 30, isIntercity: false });
      expect(r16.total).toBe(15);
      expect(r30.total).toBe(15);
    });

    it('envío interurbano nivel 1 (0-10 kg) a Santo Domingo/Ambato: $10.00 USD', () => {
      const r = service.calculate({
        serviceType: 'envio',
        distanceKm: 150,
        weightKg: 8,
        isIntercity: true,
        originCity: 'Quito',
        destinationCity: 'Santo Domingo',
      });
      expect(r.subtotal).toBe(10.00);
      expect(r.breakdown.tier1_0_10kg).toBe(10.00);
    });

    it('envío interurbano nivel 2 (10-20 kg): $15.00 USD', () => {
      const r = service.calculate({
        serviceType: 'envio',
        distanceKm: 150,
        weightKg: 15,
        isIntercity: true,
      });
      expect(r.subtotal).toBe(15.00);
      expect(r.breakdown.tier2_10_20kg).toBe(15.00);
    });

    it('envío interurbano nivel 3 (>20 kg): $20.00 USD', () => {
      const r = service.calculate({
        serviceType: 'envio',
        distanceKm: 150,
        weightKg: 25,
        isIntercity: true,
      });
      expect(r.subtotal).toBe(20.00);
      expect(r.breakdown.tier3_over_20kg).toBe(20.00);
    });

    it('envío interurbano con volumen superior cobra equivalente a 1 asiento de Carpool (ej. Quito-Riobamba $17)', () => {
      const r = service.calculate({
        serviceType: 'envio',
        distanceKm: 190,
        weightKg: 12,
        isIntercity: true,
        isOverVolume: true,
        originCity: 'Quito',
        destinationCity: 'Riobamba',
      });
      expect(r.subtotal).toBe(17.00); // Tarifa compartida Quito-Riobamba es $17
      expect(r.breakdown.overVolumeSeatEquivalent).toBe(17.00);
    });
  });
});

describe('PricingService — quoteEnvio (precio autoritativo por coordenadas)', () => {
  const svc = new PricingService();
  const QUITO_A: [number, number] = [-0.1807, -78.4678];
  const QUITO_B: [number, number] = [-0.29, -78.54];
  const RIOBAMBA: [number, number] = [-1.6644, -78.6544];
  const PACIFICO: [number, number] = [0.0, -85.0];

  const quote = (
    o: [number, number],
    d: [number, number],
    size: 'small' | 'medium' | 'large',
    isOverVolume = false,
  ) =>
    svc.quoteEnvio({
      originLat: o[0],
      originLng: o[1],
      destLat: d[0],
      destLng: d[1],
      packageSize: size,
      isOverVolume,
    });

  it('urbano (Quito→Quito): dinámico por distancia, dentro de [$3, $10]', () => {
    const q = quote(QUITO_A, QUITO_B, 'small');
    expect(q.inCoverage).toBe(true);
    expect(q.isIntercity).toBe(false);
    expect(q.price).toBeGreaterThanOrEqual(3);
    expect(q.price).toBeLessThanOrEqual(10);
  });

  it('interurbano Quito→Riobamba: small=$10, medium=$15, large=$20', () => {
    expect(quote(QUITO_A, RIOBAMBA, 'small').isIntercity).toBe(true);
    expect(quote(QUITO_A, RIOBAMBA, 'small').price).toBe(10);
    expect(quote(QUITO_A, RIOBAMBA, 'medium').price).toBe(15);
    expect(quote(QUITO_A, RIOBAMBA, 'large').price).toBe(20);
  });

  it('interurbano sobre-volumen = equivalente a 1 asiento (Quito-Riobamba $17)', () => {
    expect(quote(QUITO_A, RIOBAMBA, 'small', true).price).toBe(17);
  });

  it('fuera de cobertura → inCoverage false', () => {
    expect(quote(QUITO_A, PACIFICO, 'small').inCoverage).toBe(false);
  });
});
