// Source of truth de pricing — usado por payment-service (backend) y
// próximamente por frontend-webapp + mobile (cotización).
//
// Pure functions (sin DI, sin NestJS runtime — usables en frontend):
//   - isEcuadorHoliday
//   - getDynamicSurchargeRate
//   - getClientSurchargeRate
//   - applyDynamicPricing
//
// Constantes + types:
//   - QUITO_ZONE_SURCHARGE / QuitoZone
//   - GOING_SHARED_ROUTES
//   - RideMode, ClientSegment, ServiceType, FareBreakdown
//
// Clase NestJS (backend only — necesita @Injectable):
//   - PricingService
//
// Ver README.md para reglas de recargos resumidas.

export * from './lib/pricing.service';
// Tabla de tarifas oficiales de Going — autoritativa para todo el monorepo.
// Antes vivía duplicada en customer-support-service/knowledge-base/fares.ts
// con valores distintos a libs/pricing.GOING_SHARED_ROUTES → causa de
// inconsistencias entre cotización (bot) y cobro (payment-service).
export * from './lib/fares';
// Catálogo canónico de ciudades + resolución espacial (buscador unificado).
// city.id ≡ claves normalizadas de FARES → clasificación y tarifa alineadas.
export * from './lib/cities';
// Corredores interurbanos (geometría de rutas; precios siempre vía FARES).
export * from './lib/corridors';
// Configuración de asientos de carpooling (SUV/SUV XL, grupo, delantero).
export * from './lib/seats';
