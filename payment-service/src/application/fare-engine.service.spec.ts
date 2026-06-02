import { FareEngine } from './fare-engine.service';
import * as pricing from './pricing.service';

// Aislamos FareEngine de las reglas de surge dinámico (probadas aparte en
// libs/pricing): controlamos applyDynamicPricing para verificar SOLO la
// lógica propia del motor — tiers de envío, canje de puntos, comisión y
// redondeo. PricingService se stubea porque emitDecoratorMetadata lo
// referencia en el constructor.
jest.mock('./pricing.service', () => ({
  PricingService: class {},
  applyDynamicPricing: jest.fn(),
}));

const mockedApply = pricing.applyDynamicPricing as jest.Mock;

describe('FareEngine', () => {
  let engine: FareEngine;
  let routing: { route: jest.Mock };

  beforeEach(() => {
    routing = { route: jest.fn() };
    engine = new FareEngine(routing as never, {} as never);

    mockedApply.mockReset();
    // Por defecto: sin recargos → adjustedPrice = subtotal.
    mockedApply.mockImplementation(({ basePrice }: { basePrice: number }) => ({
      adjustedPrice: basePrice,
      timeSurchargeRate: 0,
      clientSurchargeRate: 0,
      discountRate: 0,
      originSurcharge: 0,
    }));
  });

  const route = (over: Partial<{ distanceKm: number; durationMinutes: number }> = {}) =>
    routing.route.mockResolvedValue({
      distanceKm: over.distanceKm ?? 10,
      durationMinutes: over.durationMinutes ?? 20,
      provider: 'mock',
      fallback: false,
    });

  describe('transporte', () => {
    it('calcula subtotal = base + km + minutos', async () => {
      route({ distanceKm: 10, durationMinutes: 20 });
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'transport',
        clientSegment: 'public',
      });
      // 2.5 base + 10*0.5 (5) + 20*0.1 (2) = 9.5
      expect(q.baseFare).toBe(2.5);
      expect(q.distanceCost).toBe(5);
      expect(q.durationCost).toBe(2);
      expect(q.subtotal).toBe(9.5);
      expect(q.total).toBe(9.5);
    });

    it('aplica comisión del 20% y deja el resto al conductor', async () => {
      route();
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'transport',
        clientSegment: 'public',
      });
      // total 9.5 → fee 1.9, conductor 7.6
      expect(q.platformFee).toBe(1.9);
      expect(q.providerAmount).toBe(7.6);
    });

    it('refleja recargos cuando applyDynamicPricing los añade', async () => {
      route();
      // Tipo A: +25% sobre subtotal 9.5 → 11.875 → el motor redondea a 11.88
      mockedApply.mockImplementation(({ basePrice }: { basePrice: number }) => ({
        adjustedPrice: basePrice * 1.25,
        timeSurchargeRate: 0,
        clientSurchargeRate: 0.25,
        discountRate: 0,
        originSurcharge: 0,
      }));
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'transport',
        clientSegment: 'agency',
      });
      expect(q.clientSurchargeRate).toBe(0.25);
      expect(q.surcharges).toBeCloseTo(2.38, 2); // 11.88 - 9.5
      expect(q.total).toBeCloseTo(11.88, 2);
    });
  });

  describe('envíos (precio fijo por tier de peso)', () => {
    it('tier A: 0–10 kg cuesta $10', async () => {
      route();
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'envio',
        clientSegment: 'public',
        weightKg: 5,
      });
      expect(q.weightCost).toBe(10);
      expect(q.subtotal).toBe(10);
      expect(q.total).toBe(10);
      // comisión de envíos = 18%
      expect(q.platformFee).toBeCloseTo(1.8, 2);
      expect(q.providerAmount).toBeCloseTo(8.2, 2);
    });

    it('tier B: 10–20 kg cuesta $15', async () => {
      route();
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'envio',
        clientSegment: 'public',
        weightKg: 15,
      });
      expect(q.subtotal).toBe(15);
    });

    it('rechaza envíos de más de 20 kg', async () => {
      route();
      await expect(
        engine.quote({
          origin: { lat: 0, lng: 0 },
          destination: { lat: 1, lng: 1 },
          category: 'envio',
          clientSegment: 'public',
          weightKg: 25,
        })
      ).rejects.toThrow('excede el límite de 20 kg');
    });
  });

  describe('canje de puntos (sólo clientes public)', () => {
    it('canjea puntos a 100 pts = $1 y descuenta del total', async () => {
      route();
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'transport',
        clientSegment: 'public',
        redeemPoints: 100,
        availablePoints: 1000,
      });
      // 100 pts = $1 de descuento, bajo el tope (50% de 9.5 = 4.75)
      expect(q.pointsDiscount).toBe(1);
      expect(q.pointsRedeemed).toBe(100);
      expect(q.total).toBe(8.5);
    });

    it('topa el descuento al 50% del precio', async () => {
      route();
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'transport',
        clientSegment: 'public',
        redeemPoints: 5000, // $50 deseados
        availablePoints: 5000,
      });
      // tope = 50% de 9.5 = 4.75
      expect(q.pointsMaxDiscount).toBe(4.75);
      expect(q.pointsDiscount).toBe(4.75);
      expect(q.pointsRedeemed).toBe(475);
      expect(q.total).toBe(4.75);
    });

    it('limita el canje al saldo disponible', async () => {
      route();
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'transport',
        clientSegment: 'public',
        redeemPoints: 1000,
        availablePoints: 100, // sólo 100 pts disponibles = $1
      });
      expect(q.pointsDiscount).toBe(1);
      expect(q.total).toBe(8.5);
    });

    it('NO canjea puntos para clientes corporate/agency', async () => {
      route();
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'transport',
        clientSegment: 'corporate',
        redeemPoints: 1000,
        availablePoints: 1000,
      });
      expect(q.pointsDiscount).toBe(0);
      expect(q.pointsRedeemed).toBe(0);
      expect(q.pointsEarned).toBe(0); // sólo Tipo B gana puntos
    });

    it('clientes public ganan puntos = floor(total pagado)', async () => {
      route();
      const q = await engine.quote({
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        category: 'transport',
        clientSegment: 'public',
      });
      expect(q.pointsEarned).toBe(9); // floor(9.5)
    });
  });

  it('propaga los metadatos de routing al quote', async () => {
    routing.route.mockResolvedValue({
      distanceKm: 12.3,
      durationMinutes: 25,
      provider: 'osrm',
      fallback: true,
    });
    const q = await engine.quote({
      origin: { lat: 0, lng: 0 },
      destination: { lat: 1, lng: 1 },
      category: 'transport',
      clientSegment: 'public',
    });
    expect(q.distanceKm).toBe(12.3);
    expect(q.routingProvider).toBe('osrm');
    expect(q.routingFallback).toBe(true);
    expect(q.currency).toBe('USD');
  });
});
