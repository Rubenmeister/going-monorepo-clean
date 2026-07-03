/**
 * @going-platform/going-kb — Centro de Información Going.
 *
 * Loader y queries del directorio knowledge-base/ del monorepo. Reemplaza
 * las copias hardcoded en libs/pricing/fares.ts y
 * customer-support-service/knowledge-base/going-services.ts.
 *
 * Uso típico:
 *
 *   import { initKnowledgeBase, findRoute, getContactInfo } from '@going-platform/going-kb';
 *
 *   // Al startup del servicio (NestJS bootstrap / main.ts):
 *   const kb = initKnowledgeBase();
 *   console.log(`Going KB loaded: ${kb.rutas.length} rutas, ` +
 *               `${kb.lugares.length} lugares, ` +
 *               `${kb.warnings.length} warnings`);
 *
 *   // En cualquier request handler:
 *   const fare = findRoute({
 *     origin:      { canton: 'quito', zone: 'centro_norte' },
 *     destination: { canton: 'riobamba' },
 *     modality:    'shared',
 *     vehicle:     'suv',
 *     when:        new Date(),
 *     clientType:  'retail',
 *   });
 *   // → { basePrice: 20, finalPrice: 24, breakdown: [...], revisar: false, trusted: true }
 */

// Loader (llamado al startup)
export { initKnowledgeBase, getKnowledgeBase, resetKnowledgeBaseCacheForTests } from './lib/loader';

// Queries (llamadas en runtime)
export {
  findRoute,
  type FindRouteOpts,
  getCanton,
  listLugares,
  isCovered,
  listActiveCities,
  listComingSoonCities,
  getProductInfo,
  listProducts,
  getVehicleInfo,
  getContactInfo,
  getIdentity,
  getAboutText,
  getKbWarnings,
  countRutasPendientesRevision,
  consultarConocimiento,
  getRentalQuote,
  type RentalQuoteOpts,
  getShippingQuote,
} from './lib/queries';

// Tipos públicos
export type {
  Modality,
  VehicleId,
  ClientTypeId,
  VehicleInfo,
  ZoneInfo,
  CityZones,
  DynamicSurchargeRule,
  FeriadoSurcharge,
  ClientTypeInfo,
  RouteEndpoint,
  RouteEntry,
  PackageType,
  UrbanParcelPricing,
  EnviosKB,
  CoverageCity,
  CoverageKB,
  RentalKB,
  ShippingKB,
  FleetEntry,
  FleetKB,
  ProductDoc,
  ContactKB,
  LugarInfo,
  RawDoc,
  IdentityKB,
  KnowledgeBaseSnapshot,
  FareBreakdownItem,
  FareResult,
} from './lib/types';
