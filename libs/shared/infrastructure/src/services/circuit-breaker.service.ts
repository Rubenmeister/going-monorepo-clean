/**
 * Circuit Breaker Service
 * Implements the circuit breaker pattern for external service resilience
 * States: Closed → Open → Half-Open → Closed
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Normal operation, requests pass through
  OPEN = 'OPEN', // Failing, requests immediately rejected
  HALF_OPEN = 'HALF_OPEN', // Testing recovery, limited requests allowed
}

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold?: number; // Failures before opening (default: 5)
  successThreshold?: number; // Successes in half-open before closing (default: 2)
  timeout?: number; // Milliseconds in open state before half-open (default: 60000)
  volumeThreshold?: number; // Min requests before checking threshold (default: 10)
  fallbackFunction?: <T>(error: Error) => Promise<T> | T;
}

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  successCount: number;
  failureCount: number;
  totalRequests: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

@Injectable()
export class CircuitBreaker implements OnModuleDestroy {
  private readonly logger = new Logger(CircuitBreaker.name);
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private readonly config: Required<CircuitBreakerConfig>;
  private stateChangeCallbacks: Array<(state: CircuitBreakerState) => void> =
    [];

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000,
      volumeThreshold: config.volumeThreshold || 10,
      fallbackFunction: config.fallbackFunction || undefined,
      ...config,
    };

    this.logger.log(`[CircuitBreaker] Initialized: ${this.config.name}`);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: CircuitBreakerState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Execute function through circuit breaker
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: { serviceName?: string; operationName?: string }
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (
        !this.nextAttemptTime ||
        Date.now() < this.nextAttemptTime.getTime()
      ) {
        const error = new Error(
          `[CircuitBreaker] ${this.config.name} is OPEN. Service unavailable.`
        );
        this.logger.warn(error.message, { context });
        return this.executeFallback<T>(error, context);
      } else {
        // Attempt to transition to half-open
        this.transitionToHalfOpen();
      }
    }

    // Half-open: limited requests allowed
    if (
      this.state === CircuitBreakerState.HALF_OPEN &&
      this.totalRequests > 0
    ) {
      this.logger.debug(
        `[CircuitBreaker] ${this.config.name} in HALF_OPEN state`
      );
    }

    try {
      const result = await fn();
      this.recordSuccess(context);
      return result;
    } catch (error) {
      this.recordFailure(error, context);
      return this.executeFallback<T>(error as Error, context);
    }
  }

  /**
   * Execute function synchronously
   */
  executeSync<T>(
    fn: () => T,
    context?: { serviceName?: string; operationName?: string }
  ): T {
    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (
        !this.nextAttemptTime ||
        Date.now() < this.nextAttemptTime.getTime()
      ) {
        const error = new Error(
          `[CircuitBreaker] ${this.config.name} is OPEN. Service unavailable.`
        );
        this.logger.warn(error.message, { context });
        throw error;
      } else {
        this.transitionToHalfOpen();
      }
    }

    try {
      const result = fn();
      this.recordSuccess(context);
      return result;
    } catch (error) {
      this.recordFailure(error, context);
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  private recordSuccess(context?: any): void {
    this.successCount++;
    this.totalRequests++;
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }

    this.logger.debug(
      `[CircuitBreaker] ${this.config.name} success. Total: ${this.totalRequests}, State: ${this.state}`,
      { context }
    );
  }

  /**
   * Record failed execution
   */
  private recordFailure(error: Error | any, context?: any): void {
    this.failureCount++;
    this.totalRequests++;
    this.lastFailureTime = new Date();
    this.successCount = 0;

    this.logger.warn(
      `[CircuitBreaker] ${this.config.name} failed. Failures: ${this.failureCount}/${this.config.failureThreshold}`,
      { error: error.message, context }
    );

    if (this.shouldTrip()) {
      this.transitionToOpen();
    }
  }

  /**
   * Check if circuit should trip (open)
   */
  private shouldTrip(): boolean {
    return (
      this.totalRequests >= this.config.volumeThreshold &&
      this.failureCount >= this.config.failureThreshold
    );
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    if (this.state !== CircuitBreakerState.CLOSED) {
      this.logger.log(
        `[CircuitBreaker] ${this.config.name} transitioning to CLOSED (recovered)`
      );
      this.state = CircuitBreakerState.CLOSED;
      this.failureCount = 0;
      this.successCount = 0;
      this.totalRequests = 0;
      this.notifyStateChange();
    }
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
    this.logger.warn(
      `[CircuitBreaker] ${
        this.config.name
      } transitioning to OPEN. Next attempt: ${this.nextAttemptTime.toISOString()}`
    );
    this.notifyStateChange();
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HALF_OPEN;
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.log(
      `[CircuitBreaker] ${this.config.name} transitioning to HALF_OPEN (testing recovery)`
    );
    this.notifyStateChange();
  }

  /**
   * Execute fallback function
   */
  private async executeFallback<T>(error: Error, context?: any): Promise<T> {
    if (this.config.fallbackFunction) {
      try {
        this.logger.debug(
          `[CircuitBreaker] ${this.config.name} executing fallback`,
          { context }
        );
        return await this.config.fallbackFunction(error);
      } catch (fallbackError) {
        this.logger.error(
          `[CircuitBreaker] ${this.config.name} fallback failed`,
          { error: (fallbackError as Error).message }
        );
        throw error;
      }
    }
    throw error;
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      successCount: this.successCount,
      failureCount: this.failureCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Get circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.logger.log(`[CircuitBreaker] ${this.config.name} manually reset`);
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.transitionToClosed();
  }

  /**
   * Notify state change listeners
   */
  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach((callback) => {
      callback(this.state);
    });
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    this.logger.log(`[CircuitBreaker] ${this.config.name} shutting down`);
    this.stateChangeCallbacks = [];
  }
}

/**
 * Circuit Breaker Factory Service
 * Creates and manages circuit breakers for multiple services
 */
@Injectable()
export class CircuitBreakerFactory implements OnModuleDestroy {
  private readonly logger = new Logger(CircuitBreakerFactory.name);
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Create or get existing circuit breaker
   */
  create(config: CircuitBreakerConfig): CircuitBreaker {
    if (this.breakers.has(config.name)) {
      return this.breakers.get(config.name)!;
    }

    const breaker = new CircuitBreaker(config);
    this.breakers.set(config.name, breaker);
    this.logger.log(`[CircuitBreakerFactory] Created breaker: ${config.name}`);
    return breaker;
  }

  /**
   * Get existing circuit breaker
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    this.breakers.forEach((breaker, name) => {
      metrics[name] = breaker.getMetrics();
    });
    return metrics;
  }

  /**
   * Get health status
   */
  getHealth(): {
    healthy: boolean;
    openBreakers: string[];
    metrics: Record<string, CircuitBreakerMetrics>;
  } {
    const metrics = this.getAllMetrics();
    const openBreakers = Object.entries(metrics)
      .filter(([, m]) => m.state === CircuitBreakerState.OPEN)
      .map(([name]) => name);

    return {
      healthy: openBreakers.length === 0,
      openBreakers,
      metrics,
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.logger.log('[CircuitBreakerFactory] Resetting all breakers');
    this.breakers.forEach((breaker) => breaker.reset());
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    this.logger.log('[CircuitBreakerFactory] Shutting down');
    this.breakers.forEach((breaker) => breaker.onModuleDestroy());
    this.breakers.clear();
  }
}
