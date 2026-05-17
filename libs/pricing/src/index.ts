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
