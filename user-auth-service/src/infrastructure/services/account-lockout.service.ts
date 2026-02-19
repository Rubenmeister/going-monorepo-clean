import { Injectable, Logger } from '@nestjs/common';
import { ok, err, Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

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
 * Uses Redis for fast, automatic expiration
 */
@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);

  // Configuration
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly LOCKOUT_DURATION_MS =
    this.LOCKOUT_DURATION_MINUTES * 60 * 1000;

  // Redis key patterns
  private readonly FAILED_ATTEMPTS_KEY = (userId: UUID) =>
    `lockout:attempts:${userId}`;
  private readonly LOCKOUT_KEY = (userId: UUID) => `lockout:locked:${userId}`;

  constructor(
    // In production, inject Redis client here
    // private readonly redis: Redis,
  ) {}

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId: UUID): Promise<Result<boolean, Error>> {
    try {
      // TODO: Implement Redis check
      // const isLocked = await this.redis.exists(this.LOCKOUT_KEY(userId));
      // return ok(isLocked === 1);

      this.logger.warn(
        `AccountLockoutService.isAccountLocked: Redis integration not yet implemented`,
      );
      return ok(false);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to check account lockout status'),
      );
    }
  }

  /**
   * Record a failed login attempt
   * Returns the new attempt count
   */
  async recordFailedAttempt(
    userId: UUID,
  ): Promise<Result<{ attempts: number; isLocked: boolean }, Error>> {
    try {
      // TODO: Implement Redis increment
      // const key = this.FAILED_ATTEMPTS_KEY(userId);
      // await this.redis.incr(key);
      // await this.redis.expire(key, this.LOCKOUT_DURATION_MINUTES * 60);

      // const attempts = await this.redis.get(key);
      // const attemptCount = parseInt(attempts || '0', 10);

      const attemptCount = 1; // Placeholder

      // Lock account if max attempts exceeded
      if (attemptCount >= this.MAX_FAILED_ATTEMPTS) {
        const lockResult = await this.lockAccount(userId);

        if (lockResult.isErr()) {
          this.logger.warn(
            `Failed to lock account after ${attemptCount} attempts`,
          );
          return err(lockResult.error);
        }

        this.logger.warn(
          `Account ${userId} locked after ${attemptCount} failed attempts`,
        );

        return ok({
          attempts: attemptCount,
          isLocked: true,
        });
      }

      this.logger.debug(
        `Failed login attempt for user ${userId}: ${attemptCount}/${this.MAX_FAILED_ATTEMPTS}`,
      );

      return ok({
        attempts: attemptCount,
        isLocked: false,
      });
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to record failed attempt'),
      );
    }
  }

  /**
   * Reset failed attempts counter on successful login
   */
  async resetFailedAttempts(userId: UUID): Promise<Result<void, Error>> {
    try {
      // TODO: Implement Redis delete
      // const key = this.FAILED_ATTEMPTS_KEY(userId);
      // await this.redis.del(key);

      this.logger.debug(`Reset failed attempts for user ${userId}`);
      return ok(undefined);
    } catch (error) {
      this.logger.warn(
        `Failed to reset attempts counter: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't fail login on this error
      return ok(undefined);
    }
  }

  /**
   * Lock an account
   */
  private async lockAccount(userId: UUID): Promise<Result<void, Error>> {
    try {
      // TODO: Implement Redis set with expiration
      // const key = this.LOCKOUT_KEY(userId);
      // await this.redis.setex(
      //   key,
      //   this.LOCKOUT_DURATION_MS / 1000,
      //   JSON.stringify({
      //     lockedAt: new Date().toISOString(),
      //     reason: 'max_failed_attempts',
      //   }),
      // );

      this.logger.warn(
        `Account locked for ${this.LOCKOUT_DURATION_MINUTES} minutes: ${userId}`,
      );
      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to lock account'),
      );
    }
  }

  /**
   * Manually unlock an account (admin operation)
   */
  async unlockAccount(userId: UUID): Promise<Result<void, Error>> {
    try {
      // TODO: Implement Redis delete
      // const lockKey = this.LOCKOUT_KEY(userId);
      // const attemptsKey = this.FAILED_ATTEMPTS_KEY(userId);
      // await this.redis.del(lockKey, attemptsKey);

      this.logger.info(`Account unlocked by admin: ${userId}`);
      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to unlock account'),
      );
    }
  }

  /**
   * Get remaining lockout time in seconds
   */
  async getRemainingLockoutTime(userId: UUID): Promise<Result<number, Error>> {
    try {
      // TODO: Implement Redis TTL
      // const key = this.LOCKOUT_KEY(userId);
      // const ttl = await this.redis.ttl(key);
      // return ok(ttl > 0 ? ttl : 0);

      return ok(0); // Placeholder
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to get lockout time'),
      );
    }
  }

  /**
   * Get failed attempts count
   */
  async getFailedAttemptsCount(userId: UUID): Promise<Result<number, Error>> {
    try {
      // TODO: Implement Redis get
      // const key = this.FAILED_ATTEMPTS_KEY(userId);
      // const count = await this.redis.get(key);
      // return ok(parseInt(count || '0', 10));

      return ok(0); // Placeholder
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to get attempts count'),
      );
    }
  }
}
