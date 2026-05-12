/**
 * Tabla de precios de Anthropic Claude por modelo (USD por 1M tokens).
 *
 * Fuente: https://www.anthropic.com/pricing  (verificada mayo 2026)
 * Si Anthropic cambia precios, ajustar acá. Los costos guardados en
 * intentions con `cycleCostUsd` reflejan el precio del momento de la
 * call — historical accuracy preservada. Solo cambios FUTUROS usarán
 * la tabla actualizada.
 *
 * Cache pricing nota:
 *   - cache_read = 10% del input fresh price (90% descuento)
 *   - cache_creation = 125% del input fresh price (25% premium para escribir)
 *   - cached + creation + uncached_fresh = input_tokens total
 */

export interface ModelPricing {
  inputUncached:  number;  // USD por 1M tokens, input nuevo NO cacheado
  cacheRead:      number;  // input servido desde cache
  cacheCreation:  number;  // input escrito a cache la primera vez
  output:         number;  // tokens de respuesta
}

export const MODEL_PRICES: Record<string, ModelPricing> = {
  'claude-sonnet-4-5': {
    inputUncached: 3,
    cacheRead:     0.30,
    cacheCreation: 3.75,
    output:        15,
  },
  'claude-opus-4-5': {
    inputUncached: 15,
    cacheRead:     1.50,
    cacheCreation: 18.75,
    output:        75,
  },
  'claude-haiku-4-5': {
    inputUncached: 0.80,
    cacheRead:     0.08,
    cacheCreation: 1.00,
    output:        4,
  },
};

/**
 * Default cuando el modelo no está en la tabla. Asumo Sonnet (más común).
 * Si alguna vez vemos modelos `unknown` en el dashboard de costos, agregar
 * el precio acá.
 */
const FALLBACK_PRICING = MODEL_PRICES['claude-sonnet-4-5'];

/**
 * Calcula el costo USD de un ciclo de razonamiento dado el breakdown
 * de tokens del response de Anthropic.
 *
 * tokensIn ya incluye los cached + cache_creation, entonces:
 *   uncached_fresh = tokensIn - cacheReadTokens - cacheCreationTokens
 *
 * Si tokensIn < cached_read + cache_creation (no debería pasar pero
 * defensa), uncached = 0.
 */
export function computeCycleCostUsd(args: {
  model:               string;
  tokensIn:            number;
  tokensOut:           number;
  cacheReadTokens:     number;
  cacheCreationTokens: number;
}): number {
  const p = MODEL_PRICES[args.model] ?? FALLBACK_PRICING;
  const uncachedInput = Math.max(0, args.tokensIn - args.cacheReadTokens - args.cacheCreationTokens);
  const cost =
    (uncachedInput              / 1_000_000) * p.inputUncached +
    (args.cacheReadTokens       / 1_000_000) * p.cacheRead     +
    (args.cacheCreationTokens   / 1_000_000) * p.cacheCreation +
    (args.tokensOut             / 1_000_000) * p.output;
  return Number(cost.toFixed(6)); // 6 decimal places (micro-dollars)
}
