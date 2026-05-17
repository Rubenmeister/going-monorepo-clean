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
