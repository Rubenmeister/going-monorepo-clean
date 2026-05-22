/**
 * Tests del resolvedor espacial del buscador unificado.
 * Protegen la clasificación urbano / interurbano / corredor aeropuerto, que
 * decide qué modalidad y qué tarifa se le ofrece al cliente.
 */

import {
  resolveCity,
  classifyRoute,
  haversineKm,
  getCity,
} from './cities';
import { findCorridorForCities as findCorridor } from './corridors';

// Puntos de referencia [lat, lng]
const QUITO_CENTRO: [number, number] = [-0.1807, -78.4678];
const QUITO_SUR: [number, number] = [-0.29, -78.54];
const AEROPUERTO: [number, number] = [-0.1292, -78.3575];
const AMBATO: [number, number] = [-1.2417, -78.6197];
const RIOBAMBA: [number, number] = [-1.6644, -78.6544];
const SALCEDO: [number, number] = [-1.0467, -78.5917];
const PACIFICO: [number, number] = [0.0, -85.0]; // mar abierto, fuera de cobertura

describe('cities — resolveCity', () => {
  it('un punto en el centro de Quito resuelve a quito', () => {
    expect(resolveCity(...QUITO_CENTRO)?.id).toBe('quito');
  });

  it('el aeropuerto resuelve a aeropuerto (no a quito)', () => {
    const c = resolveCity(...AEROPUERTO);
    expect(c?.id).toBe('aeropuerto');
    expect(c?.isAirport).toBe(true);
  });

  it('Ambato resuelve a ambato', () => {
    expect(resolveCity(...AMBATO)?.id).toBe('ambato');
  });

  it('Salcedo resuelve a salcedo y está marcada como población cercana a urbe', () => {
    const c = resolveCity(...SALCEDO);
    expect(c?.id).toBe('salcedo');
    expect(c?.smallTownNearHub).toBe(true);
  });

  it('un punto en el Pacífico cae fuera de cobertura (null)', () => {
    expect(resolveCity(...PACIFICO)).toBeNull();
  });
});

describe('cities — classifyRoute', () => {
  it('dos puntos dentro de Quito → urbano', () => {
    const r = classifyRoute(...QUITO_CENTRO, ...QUITO_SUR);
    expect(r.routeClass).toBe('urban');
    expect(r.isIntercity).toBe(false);
    expect(r.isAirportCorridor).toBe(false);
  });

  it('Quito → Riobamba → interurbano con distancia real > 100 km', () => {
    const r = classifyRoute(...QUITO_CENTRO, ...RIOBAMBA);
    expect(r.routeClass).toBe('intercity');
    expect(r.isIntercity).toBe(true);
    expect(r.originCity).toBe('quito');
    expect(r.destinationCity).toBe('riobamba');
    expect(r.distanceKm).toBeGreaterThan(100);
  });

  it('Quito → Aeropuerto → corredor aeropuerto (no interurbano genérico)', () => {
    const r = classifyRoute(...QUITO_CENTRO, ...AEROPUERTO);
    expect(r.routeClass).toBe('airport_corridor');
    expect(r.isAirportCorridor).toBe(true);
    expect(r.isIntercity).toBe(false);
  });

  it('Ambato → Salcedo → interurbano con tramo de población pequeña', () => {
    const r = classifyRoute(...AMBATO, ...SALCEDO);
    expect(r.routeClass).toBe('intercity');
    expect(r.smallTownLeg).toBe(true);
  });

  it('destino fuera de cobertura → out_of_coverage', () => {
    const r = classifyRoute(...QUITO_CENTRO, ...PACIFICO);
    expect(r.routeClass).toBe('out_of_coverage');
    expect(r.destinationCity).toBeNull();
  });
});

describe('cities — haversineKm', () => {
  it('Quito → Ambato ≈ 100-140 km', () => {
    const d = haversineKm(...QUITO_CENTRO, ...AMBATO);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(140);
  });

  it('distancia de un punto a sí mismo es 0', () => {
    expect(haversineKm(...QUITO_CENTRO, ...QUITO_CENTRO)).toBeCloseTo(0, 5);
  });
});

describe('cities — catálogo alineado con FARES', () => {
  it('getCity devuelve la ciudad por id', () => {
    expect(getCity('riobamba')?.label).toBe('Riobamba');
  });

  it('los ids del catálogo son claves válidas (minúscula, guion bajo)', () => {
    expect(getCity('santo_domingo')).toBeDefined();
    expect(getCity('aeropuerto')).toBeDefined();
  });
});

describe('corridors — findCorridorForCities', () => {
  it('Ambato ↔ Quito pertenece al corredor sierra_centro', () => {
    expect(findCorridor('ambato', 'quito')?.id).toBe('sierra_centro');
    expect(findCorridor('quito', 'ambato')?.id).toBe('sierra_centro');
  });

  it('Ibarra ↔ Quito pertenece al corredor sierra_norte', () => {
    expect(findCorridor('ibarra', 'quito')?.id).toBe('sierra_norte');
  });

  it('par sin corredor común devuelve null', () => {
    expect(findCorridor('ambato', 'ibarra')).toBeNull();
  });
});
