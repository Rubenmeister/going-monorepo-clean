import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ok, err, Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { Redis } from 'ioredis';

/**
 * Account Lockout Service
 * Implements account security by locking accounts after failed login attempts
 *
 * Strategy:
 * - Track failed login attempts per user
 * - Lock account after 5 failed attempts
 * - Lock duration: 15 minutes
 * - Lock is automatically released after duration
 * - Successful login resets counter
 *
 * Uses Redis for fast, atomic operations and automatic expiration
 *
 * Redis Keys:
 * - lockout:attempts:{userId} -> integer (failed attempt count)
 * - lockout:locked:{userId} -> JSON (lockout metadata)
 */
@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);

  // Configuration
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly LOCKOUT_DURATION_SECONDS =
    this.LOCKOUT_DURATION_MINUTES * 60;

  // Redis key patterns
  private readonly FAILED_ATTEMPTS_KEY = (userId: UUID) =>
    `lockout:attempts:${userId}`;
  private readonly LOCKOUT_KEY = (userId: UUID) => `lockout:locked:${userId}`;

  constructor(
    @Optional()
    @Inject('REDIS_CLIENT')
    private readonly redis?: Redis
  ) {}

  /**
   * Check if account is locked
   * Returns true if lockout key exists in Redis (account is locked)
   */
  async isAccountLocked(userId: UUID): Promise<Result<boolean, Error>> {
    try {
      if (!this.redis) {
        this.logger.warn(
          'Redis client not available, account lockout disabled'
        );
        return ok(false);
      }

      // Check if lockout key exists in Redis
      const lockKey = this.LOCKOUT_KEY(userId);
      const isLocked = await this.redis.exists(lockKey);

      if (isLocked === 1) {
        this.logger.debug(`Account is locked: ${userId}`);
        return ok(true);
      }

      return ok(false);
    } catch (error) {
      this.logger.error(
        `Error checking account lockout: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to check account lockout status')
      );
    }
  }

  /**
   * Record a failed login attempt
   * Increments attempt counter and locks account if threshold exceeded
   * Returns the new attempt count
   */
  async recordFailedAttempt(
    userId: UUID
  ): Promise<Result<{ attempts: number; isLocked: boolean }, Error>> {
    try {
      if (!this.redis) {
        this.logger.warn(
          'Redis client not available, cannot record failed attempt'
        );
        return ok({ attempts: 1, isLocked: false });
      }

      // Increment failed attempts counter
      const key = this.FAILED_ATTEMPTS_KEY(userId);
      const attemptCount = await this.redis.incr(key);

      // Set expiration time on first attempt
      if (attemptCount === 1) {
        await this.redis.expire(key, this.LOCKOUT_DURATION_SECONDS);
      }

      // Lock account if max attempts exceeded
      if (attemptCount >= this.MAX_FAILED_ATTEMPTS) {
        const lockResult = await this.lockAccount(userId);

        if (lockResult.isErr()) {
          this.logger.warn(
            `Failed to lock account after ${attemptCount} attempts`
          );
          return err(lockResult.error);
        }

        this.logger.warn(
          `Account locked after ${attemptCount} failed attempts: ${userId}`
        );

        return ok({
          attempts: attemptCount,
          isLocked: true,
        });
      }

      this.logger.debug(
        `Failed login attempt for user ${userId}: ${attemptCount}/${this.MAX_FAILED_ATTEMPTS}`
      );

      return ok({
        attempts: attemptCount,
        isLocked: false,
      });
    } catch (error) {
      this.logger.error(
        `Error recording failed attempt: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to record failed attempt')
      );
    }
  }

  /**
   * Reset failed attempts counter on successful login
   * Deletes the attempts key from Redis
   */
  async resetFailedAttempts(userId: UUID): Promise<Result<void, Error>> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis client not available, cannot reset attempts');
        return ok(undefined);
      }

      // Delete failed attempts counter
      const key = this.FAILED_ATTEMPTS_KEY(userId);
      await this.redis.del(key);

      this.logger.debug(`Reset failed attempts for user ${userId}`);
      return ok(undefined);
    } catch (error) {
      this.logger.warn(
        `Failed to reset attempts counter: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      // Don't fail login on this error
      return ok(undefined);
    }
  }

  /**
   * Lock an account
   * Sets lockout key in Redis with automatic expiration
   */
  private async lockAccount(userId: UUID): Promise<Result<void, Error>> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis client not available, cannot lock account');
        return ok(undefined);
      }

      // Store lockout metadata in Redis with TTL
      const key = this.LOCKOUT_KEY(userId);
      const lockoutData = JSON.stringify({
        lockedAt: new Date().toISOString(),
        reason: 'max_failed_attempts',
        expiresAt: new Date(
          Date.now() + this.LOCKOUT_DURATION_SECONDS * 1000
        ).toISOString(),
      });

      // SETEX: Set key with expiration in one atomic operation
      await this.redis.setex(key, this.LOCKOUT_DURATION_SECONDS, lockoutData);

      this.logger.warn(
        `Account locked for ${this.LOCKOUT_DURATION_MINUTES} minutes: ${userId}`
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(
        `Error locking account: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return err(
        error instanceof Error ? error : new Error('Failed to lock account')
      );
    }
  }

  /**
   * Manually unlock an account (admin operation)
   * Deletes both lockout and attempts keys from Redis
   */
  async unlockAccount(userId: UUID): Promise<Result<void, Error>> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis client not available, cannot unlock account');
        return ok(undefined);
      }

      // Delete both lockout and attempts keys in one operation
      const lockKey = this.LOCKOUT_KEY(userId);
      const attemptsKey = this.FAILED_ATTEMPTS_KEY(userId);
      const deletedCount = await this.redis.del(lockKey, attemptsKey);

      this.logger.info(
        `Account unlocked by admin (${deletedCount} keys removed): ${userId}`
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(
        `Error unlocking account: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return err(
        error instanceof Error ? error : new Error('Failed to unlock account')
      );
    }
  }

  /**
   * Get remaining lockout time in seconds
   * Returns TTL from Redis (time-to-live)
   */
  async getRemainingLockoutTime(userId: UUID): Promise<Result<number, Error>> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis client not available, cannot get lockout time');
        return ok(0);
      }

      // Get TTL (time-to-live) in seconds
      // Returns: positive number = seconds remaining, -2 = key does not exist, -1 = no expiration
      const key = this.LOCKOUT_KEY(userId);
      const ttl = await this.redis.ttl(key);

      // Return 0 if key doesn't exist or no expiration set
      if (ttl <= 0) {
        return ok(0);
      }

      return ok(ttl);
    } catch (error) {
      this.logger.error(
        `Error getting lockout time: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return err(
        error instanceof Error ? error : new Error('Failed to get lockout time')
      );
    }
  }

  /**
   * Get failed attempts count
   * Retrieves the current attempt counter from Redis
   */
  async getFailedAttemptsCount(userId: UUID): Promise<Result<number, Error>> {
    try {
      if (!this.redis) {
        this.logger.warn(
          'Redis client not available, cannot get attempts count'
        );
        return ok(0);
      }

      // Get the attempt counter value from Redis
      const key = this.FAILED_ATTEMPTS_KEY(userId);
      const count = await this.redis.get(key);

      // Return count or 0 if key doesn't exist
      const attemptCount = parseInt(count || '0', 10);
      return ok(attemptCount);
    } catch (error) {
      this.logger.error(
        `Error getting attempts count: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to get attempts count')
      );
    }
  }
}
