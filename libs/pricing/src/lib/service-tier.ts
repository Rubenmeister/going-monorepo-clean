/**
 * ServiceTier — calidad de servicio del viaje (decisión brand 2026-05-23,
 * corregida 2026-05-24 audit #29).
 *
 * Convención brand:
 *   - 'confort'  → SUV estándar (default para B2C). Reemplaza el legacy 'standard'.
 *   - 'premium'  → SUV gama alta. +50% sobre precio base.
 *   - 'empresa'  → Tier visual B2B en mobile. NO afecta precio aquí — el
 *                  recargo corporativo se aplica vía `clientSegment='corporate'`
 *                  en pricing.service (+25%, no descuento). Es servicio premium,
 *                  no oferta de descuento: vehículo top, conductor calificado,
 *                  espera sin cobro, facturación diferida.
 *                  Multiplier 1.0 — el +25% viene del clientSegment, no del tier.
 *
 * NO confundir con `vehicleType` (suv/suv_xl/van/van_xl/bus) que es el
 * tamaño físico del vehículo. Tier y vehicleType son ORTOGONALES — un SUV
 * Confort y un SUV Premium tienen el mismo tamaño pero distinta calidad
 * de servicio (amenities, vehículo más nuevo, conductor mejor calificado).
 */

export type ServiceTier = 'confort' | 'premium' | 'empresa';

/** Sets válidos del tier — para uso con guards o validators */
export const SERVICE_TIERS: readonly ServiceTier[] = ['confort', 'premium', 'empresa'] as const;

/**
 * Aliases legacy aceptados durante la migración brand:
 *   - 'standard' → 'confort' (rename 2026-05-23)
 *   - 'economy'  → 'confort' (nunca lanzado pero estaba en el comment de DTOs)
 *
 * Los mobile builds anteriores a v66 envían `'standard'` — el backend lo
 * acepta y normaliza a `'confort'`. Cuando todos los clientes estén en
 * v66+ (esperamos para Q3 2026), removeremos los aliases.
 */
const TIER_ALIASES: Record<string, ServiceTier> = {
  standard: 'confort',
  economy:  'confort',
};

/**
 * Normaliza un string de tier a una variante canónica. Acepta aliases
 * legacy + es defensivo con strings vacíos / undefined / case mixto.
 *
 * Ejemplos:
 *   normalizeServiceTier('confort')   // 'confort'
 *   normalizeServiceTier('Premium')   // 'premium'  (lowercased)
 *   normalizeServiceTier('standard')  // 'confort'  (alias legacy)
 *   normalizeServiceTier(undefined)   // 'confort'  (default)
 *   normalizeServiceTier('xxx')       // 'confort'  (fallback defensivo)
 *
 * Usado por:
 *   - transport-service RequestRideUseCase al recibir el DTO
 *   - customer-support BookingService al crear ride desde WhatsApp
 *   - frontend webapp/mobile al mostrar tier (label canónico)
 */
export function normalizeServiceTier(raw?: string | null): ServiceTier {
  if (!raw) return 'confort';
  const normalized = String(raw).trim().toLowerCase();
  if (SERVICE_TIERS.includes(normalized as ServiceTier)) {
    return normalized as ServiceTier;
  }
  if (TIER_ALIASES[normalized]) return TIER_ALIASES[normalized];
  return 'confort'; // fallback defensivo
}

/**
 * Multiplicador de precio por tier — aplicado sobre el precio base del
 * vehículo.
 *
 * IMPORTANTE: 'empresa' es 1.0 (no descuento). El recargo +25% corporativo
 * NO viene de aquí — viene del `clientSegment='corporate'` derivado server-
 * side desde el JWT en pricing.service.applyDynamicPricing(). Empresa es
 * SERVICIO PREMIUM con factura diferida, no descuento (regla de memoria
 * persistente, confirmada en audit #29).
 */
export const TIER_MULTIPLIER: Record<ServiceTier, number> = {
  confort: 1.0,
  premium: 1.5,
  empresa: 1.0,
};

/** Label human-readable del tier para UI (matches brand vocabulary). */
export const TIER_LABEL: Record<ServiceTier, string> = {
  confort: 'Confort',
  premium: 'Premium',
  empresa: 'Empresa',
};
