/**
 * Tests del buscador unificado (composición resolver + pricing).
 * Sin ScheduledTripService inyectado → solo valida onDemand + clasificación.
 * Fecha fija (lunes 13:00, sin recargo) para que las tarifas sean deterministas.
 */
import { PricingService } from 'pricing';
import { UnifiedSearchUseCase } from './unified-search.use-case';
import type { SearchQueryDto } from '../../api/dtos/search-query.dto';

// Lunes 16-mar-2026 13:00 → sin hora pico, sin feriado, sin fin de semana.
const NEUTRAL = '2026-03-16T13:00:00';

const QUITO_A = { lat: -0.1807, lng: -78.4678 };
const QUITO_B = { lat: -0.21, lng: -78.49 };
const RIOBAMBA = { lat: -1.6644, lng: -78.6544 };
const AEROPUERTO = { lat: -0.1292, lng: -78.3575 };
const PACIFICO = { lat: 0.0, lng: -85.0 };

function makeUseCase() {
  return new UnifiedSearchUseCase(new PricingService());
}

function query(partial: Partial<SearchQueryDto>): SearchQueryDto {
  return {
    pickup: QUITO_A,
    destination: QUITO_B,
    temporalPreference: 'immediate',
    scheduledDateTime: NEUTRAL,
    ...partial,
  } as SearchQueryDto;
}

describe('UnifiedSearchUseCase', () => {
  it('urbano inmediato → opción urban_ride con surge neutro = 1', async () => {
    const r = await makeUseCase().execute(query({ pickup: QUITO_A, destination: QUITO_B }));
    expect(r.route.routeClass).toBe('urban');
    expect(r.searchId).toBeTruthy();
    const opt = r.onDemandOptions.find((o) => o.serviceType === 'urban_ride');
    expect(opt).toBeDefined();
    expect(opt!.price).toBeGreaterThan(0);
    expect(opt!.breakdown?.surgeMultiplier).toBe(1);
  });

  it('interurbano Quito→Riobamba (público) → privado SUV = $68 (FARES 17 × 4)', async () => {
    const r = await makeUseCase().execute(query({ pickup: QUITO_A, destination: RIOBAMBA }));
    expect(r.route.routeClass).toBe('intercity');
    expect(r.route.isIntercity).toBe(true);
    const opt = r.onDemandOptions.find(
      (o) => o.serviceType === 'intercity_private_immediate',
    );
    expect(opt).toBeDefined();
    expect(opt!.price).toBe(68);
  });

  it('interurbano corporativo aplica recargo +25% sobre el público', async () => {
    const pub = await makeUseCase().execute(
      query({ pickup: QUITO_A, destination: RIOBAMBA, clientSegment: 'public' }),
    );
    const corp = await makeUseCase().execute(
      query({ pickup: QUITO_A, destination: RIOBAMBA, clientSegment: 'corporate' }),
    );
    expect(corp.onDemandOptions[0].price).toBeGreaterThan(pub.onDemandOptions[0].price);
    expect(corp.onDemandOptions[0].price).toBe(85); // round(68 × 1.25)
  });

  it('corredor aeropuerto Quito→Tababela → tarifa fija $10 (FARES quito-aeropuerto)', async () => {
    const r = await makeUseCase().execute(query({ pickup: QUITO_A, destination: AEROPUERTO }));
    expect(r.route.routeClass).toBe('airport_corridor');
    expect(r.route.isAirportCorridor).toBe(true);
    const opt = r.onDemandOptions.find((o) => o.serviceType === 'airport_transfer');
    expect(opt).toBeDefined();
    expect(opt!.price).toBe(10);
  });

  it('fuera de cobertura → sin opciones y con aviso', async () => {
    const r = await makeUseCase().execute(query({ pickup: QUITO_A, destination: PACIFICO }));
    expect(r.route.routeClass).toBe('out_of_coverage');
    expect(r.route.inCoverage).toBe(false);
    expect(r.onDemandOptions).toHaveLength(0);
    expect(r.notices.length).toBeGreaterThan(0);
  });
});
