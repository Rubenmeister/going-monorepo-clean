/**
 * Circuit Breaker Decorator
 * Apply circuit breaker pattern to methods automatically
 */

import {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitBreakerState,
} from '../services/circuit-breaker.service';

/**
 * Global circuit breaker instance map
 * In production, this would be managed by NestJS DI
 */
const circuitBreakerMap = new Map<string, CircuitBreaker>();

/**
 * Create a unique breaker key from class and method names
 */
function getBreakerKey(target: any, propertyKey: string): string {
  const className = target.constructor.name;
  return `${className}.${propertyKey}`;
}

/**
 * WithCircuitBreaker decorator
 * Wraps a method with circuit breaker protection
 *
 * @example
 * ```typescript
 * class PaymentService {
 *   @WithCircuitBreaker({
 *     failureThreshold: 5,
 *     timeout: 60000,
 *     fallbackFunction: async (error) => ({ success: false, error: error.message })
 *   })
 *   async processPayment(amount: number): Promise<PaymentResult> {
 *     return this.stripe.charge(amount);
 *   }
 * }
 * ```
 */
export function WithCircuitBreaker(config: Partial<CircuitBreakerConfig> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const breakerKey = getBreakerKey(target, propertyKey);
    const breakerName = config.name || breakerKey;

    // Create or get circuit breaker
    if (!circuitBreakerMap.has(breakerKey)) {
      const fullConfig: CircuitBreakerConfig = {
        name: breakerName,
        ...config,
      };
      circuitBreakerMap.set(breakerKey, new CircuitBreaker(fullConfig));
    }

    const breaker = circuitBreakerMap.get(breakerKey)!;

    // Replace method with circuit breaker wrapped version
    descriptor.value = async function (...args: any[]) {
      const breaker = circuitBreakerMap.get(breakerKey)!;
      return breaker.execute(() => originalMethod.apply(this, args), {
        serviceName: target.constructor.name,
        operationName: propertyKey,
        args,
      });
    };

    return descriptor;
  };
}

/**
 * Get circuit breaker instance for monitoring
 */
export function getCircuitBreaker(
  target: any,
  propertyKey: string
): CircuitBreaker | undefined {
  const breakerKey = getBreakerKey(target, propertyKey);
  return circuitBreakerMap.get(breakerKey);
}

/**
 * Get all circuit breakers
 */
export function getAllCircuitBreakers(): Record<string, CircuitBreaker> {
  const result: Record<string, CircuitBreaker> = {};
  circuitBreakerMap.forEach((breaker, key) => {
    result[key] = breaker;
  });
  return result;
}

/**
 * Reset all circuit breakers (for testing)
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakerMap.forEach((breaker) => breaker.reset());
}

/**
 * Clear all circuit breakers (for testing cleanup)
 */
export function clearAllCircuitBreakers(): void {
  circuitBreakerMap.forEach((breaker) => breaker.onModuleDestroy());
  circuitBreakerMap.clear();
}
