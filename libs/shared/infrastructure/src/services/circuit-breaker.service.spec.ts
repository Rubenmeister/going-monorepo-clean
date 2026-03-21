import {
  CircuitBreaker,
  CircuitBreakerState,
  CircuitBreakerFactory,
} from './circuit-breaker.service';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: 'test-breaker',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      volumeThreshold: 2,
    });
  });

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should have zero metrics on creation', () => {
      const metrics = breaker.getMetrics();
      expect(metrics.successCount).toBe(0);
      expect(metrics.failureCount).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });
  });

  describe('Successful Execution', () => {
    it('should execute function successfully in CLOSED state', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should increment success count', async () => {
      const fn = jest.fn().mockResolvedValue('ok');

      await breaker.execute(fn);
      const metrics = breaker.getMetrics();

      expect(metrics.successCount).toBe(1);
      expect(metrics.failureCount).toBe(0);
    });

    it('should reset failure count on success', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));
      const successFn = jest.fn().mockResolvedValue('ok');

      // Cause failure
      try {
        await breaker.execute(failFn);
      } catch {}

      // Success
      await breaker.execute(successFn);

      const metrics = breaker.getMetrics();
      expect(metrics.failureCount).toBe(0);
    });
  });

  describe('Failed Execution', () => {
    it('should record failed execution', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Service down'));

      try {
        await breaker.execute(fn);
      } catch {}

      const metrics = breaker.getMetrics();
      expect(metrics.failureCount).toBe(1);
    });

    it('should set lastFailureTime on failure', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const beforeTime = new Date();

      try {
        await breaker.execute(fn);
      } catch {}

      const metrics = breaker.getMetrics();
      expect(metrics.lastFailureTime).toBeDefined();
      expect(metrics.lastFailureTime!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
    });

    it('should reset success count on failure', async () => {
      const successFn = jest.fn().mockResolvedValue('ok');
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Success
      await breaker.execute(successFn);
      await breaker.execute(successFn);

      // Failure
      try {
        await breaker.execute(failFn);
      } catch {}

      const metrics = breaker.getMetrics();
      expect(metrics.successCount).toBe(0);
    });
  });

  describe('Circuit Trip (CLOSED → OPEN)', () => {
    it('should trip circuit after failure threshold', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should set nextAttemptTime when tripping', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch {}
      }

      const metrics = breaker.getMetrics();
      expect(metrics.nextAttemptTime).toBeDefined();
      expect(metrics.nextAttemptTime!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject requests immediately when OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trip circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch {}
      }

      // Attempt request while OPEN
      await expect(breaker.execute(fn)).rejects.toThrow('OPEN');

      // Function should NOT be called 4th time
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect volumeThreshold before tripping', async () => {
      const breaker2 = new CircuitBreaker({
        name: 'test-breaker-2',
        failureThreshold: 5,
        volumeThreshold: 10,
      });

      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // 5 failures but below volume threshold
      for (let i = 0; i < 5; i++) {
        try {
          await breaker2.execute(fn);
        } catch {}
      }

      // Should still be CLOSED
      expect(breaker2.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Recovery (OPEN → HALF_OPEN → CLOSED)', () => {
    it('should transition to HALF_OPEN after timeout', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trip circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Try again - should transition to HALF_OPEN
      const successFn = jest.fn().mockResolvedValue('ok');
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
    });

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));
      const successFn = jest.fn().mockResolvedValue('ok');

      // Trip circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch {}
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Transition to HALF_OPEN and succeed twice
      await breaker.execute(successFn);
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should reopen circuit on failure in HALF_OPEN', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));
      const successFn = jest.fn().mockResolvedValue('ok');

      // Trip circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch {}
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Transition to HALF_OPEN but fail immediately
      try {
        await breaker.execute(failFn);
      } catch {}

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should reset metrics when closing', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));
      const successFn = jest.fn().mockResolvedValue('ok');

      // Accumulate failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch {}
      }

      // Wait and recover
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await breaker.execute(successFn);
      await breaker.execute(successFn);

      const metrics = breaker.getMetrics();
      expect(metrics.failureCount).toBe(0);
      expect(metrics.successCount).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });
  });

  describe('Fallback Function', () => {
    it('should execute fallback when circuit is OPEN', async () => {
      const fallback = jest.fn().mockResolvedValue({ fallback: true });
      const breaker2 = new CircuitBreaker({
        name: 'test-fallback',
        failureThreshold: 2,
        volumeThreshold: 1,
        fallbackFunction: fallback,
      });

      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trip circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker2.execute(fn);
        } catch {}
      }

      // Next request should use fallback
      const result = await breaker2.execute(fn);
      expect(result).toEqual({ fallback: true });
      expect(fallback).toHaveBeenCalled();
    });

    it('should pass error to fallback function', async () => {
      const fallback = jest.fn().mockResolvedValue(null);
      const breaker2 = new CircuitBreaker({
        name: 'test-fallback-error',
        failureThreshold: 1,
        volumeThreshold: 1,
        fallbackFunction: fallback,
      });

      const testError = new Error('specific error');
      const fn = jest.fn().mockRejectedValue(testError);

      try {
        await breaker2.execute(fn);
      } catch {}

      expect(fallback).toHaveBeenCalledWith(testError);
    });
  });

  describe('Manual Reset', () => {
    it('should reset to CLOSED state', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trip circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(breaker.getMetrics().failureCount).toBe(0);
    });
  });

  describe('Sync Execution', () => {
    it('should execute sync functions', () => {
      const fn = jest.fn(() => 'sync result');
      const result = breaker.executeSync(fn);

      expect(result).toBe('sync result');
      expect(fn).toHaveBeenCalled();
    });

    it('should throw when circuit is OPEN (sync)', async () => {
      const failFn = jest.fn(() => {
        throw new Error('sync fail');
      });

      // Trip circuit
      for (let i = 0; i < 3; i++) {
        try {
          breaker.executeSync(failFn);
        } catch {}
      }

      // Should throw immediately
      expect(() => breaker.executeSync(failFn)).toThrow('OPEN');
    });
  });

  describe('State Change Listeners', () => {
    it('should notify on state change', async () => {
      const listener = jest.fn();
      breaker.onStateChange(listener);

      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trip circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch {}
      }

      expect(listener).toHaveBeenCalledWith(CircuitBreakerState.OPEN);
    });
  });
});

describe('CircuitBreakerFactory', () => {
  let factory: CircuitBreakerFactory;

  beforeEach(() => {
    factory = new CircuitBreakerFactory();
  });

  afterEach(() => {
    factory.onModuleDestroy();
  });

  describe('Creating Breakers', () => {
    it('should create new circuit breaker', () => {
      const breaker = factory.create({
        name: 'test-breaker',
      });

      expect(breaker).toBeDefined();
      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should return existing breaker on subsequent calls', () => {
      const breaker1 = factory.create({ name: 'test' });
      const breaker2 = factory.create({ name: 'test' });

      expect(breaker1).toBe(breaker2);
    });

    it('should get existing breaker by name', () => {
      const created = factory.create({ name: 'my-breaker' });
      const retrieved = factory.get('my-breaker');

      expect(retrieved).toBe(created);
    });

    it('should return undefined for non-existent breaker', () => {
      expect(factory.get('non-existent')).toBeUndefined();
    });
  });

  describe('Health Status', () => {
    it('should report healthy when all breakers CLOSED', () => {
      factory.create({ name: 'breaker1' });
      factory.create({ name: 'breaker2' });

      const health = factory.getHealth();

      expect(health.healthy).toBe(true);
      expect(health.openBreakers).toEqual([]);
    });

    it('should report unhealthy when any breaker OPEN', async () => {
      const breaker = factory.create({
        name: 'failing-breaker',
        failureThreshold: 1,
        volumeThreshold: 1,
      });

      const failFn = jest.fn().mockRejectedValue(new Error('fail'));

      try {
        await breaker.execute(failFn);
      } catch {}

      const health = factory.getHealth();

      expect(health.healthy).toBe(false);
      expect(health.openBreakers).toContain('failing-breaker');
    });
  });

  describe('Reset All', () => {
    it('should reset all breakers', async () => {
      const breaker1 = factory.create({
        name: 'breaker1',
        failureThreshold: 1,
        volumeThreshold: 1,
      });
      const breaker2 = factory.create({
        name: 'breaker2',
        failureThreshold: 1,
        volumeThreshold: 1,
      });

      const failFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trip both
      try {
        await breaker1.execute(failFn);
      } catch {}
      try {
        await breaker2.execute(failFn);
      } catch {}

      // Reset all
      factory.resetAll();

      expect(breaker1.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(breaker2.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Metrics', () => {
    it('should return metrics for all breakers', () => {
      factory.create({ name: 'breaker1' });
      factory.create({ name: 'breaker2' });

      const metrics = factory.getAllMetrics();

      expect(metrics).toHaveProperty('breaker1');
      expect(metrics).toHaveProperty('breaker2');
      expect(metrics.breaker1.state).toBe(CircuitBreakerState.CLOSED);
    });
  });
});
