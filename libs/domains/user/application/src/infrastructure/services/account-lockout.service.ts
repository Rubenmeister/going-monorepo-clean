import { Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';

export type LockoutError = { message: string };
export type FailedAttemptResult = { attempts: number; isLocked: boolean };

/**
 * AccountLockoutService
 *
 * Tracks failed login attempts to prevent brute-force attacks.
 * Uses Redis when available (via REDIS_URL env var).
 * Falls back to in-memory store when Redis is unavailable,
 * so login always works even if Redis is down.
 *
 * Lockout policy: 5 failed attempts -> 15 min lockout
 */
@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);

  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_SECONDS = 900; // 15 minutes

  // In-memory fallback
  private readonly memStore = new Map<
    string,
    { attempts: number; lockedUntil: number | null }
  >();

  private redisClient: any = null;
  private redisAvailable = false;

  constructor() {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl || redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) {
      this.logger.warn(
        'Redis not configured or pointing to localhost — using in-memory lockout store',
      );
      return;
    }

    try {
      const { createClient } = await import('redis').catch(() => ({ createClient: null as any }));
      if (!createClient) {
        this.logger.warn('redis package not installed — using in-memory fallback');
        return;
      }

      this.redisClient = createClient({ url: redisUrl });

      this.redisClient.on('error', (e: Error) => {
        if (this.redisAvailable) {
          this.logger.warn(`Redis connection lost — falling back to in-memory: ${e.message}`);
        }
        this.redisAvailable = false;
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis connected for account lockout');
        this.redisAvailable = true;
      });

      await this.redisClient.connect();
      this.redisAvailable = true;
    } catch (e) {
      this.logger.warn(
        `Redis init failed — using in-memory fallback: ${(e as Error).message}`,
      );
      this.redisAvailable = false;
    }
  }

  async isAccountLocked(userId: string): Promise<Result<boolean, LockoutError>> {
    try {
      if (this.redisAvailable && this.redisClient) {
        const val = await this.redisClient.get(`lockout:${userId}`);
        return ok(val !== null);
      }
      const entry = this.memStore.get(userId);
      if (!entry?.lockedUntil) return ok(false);
      const isLocked = Date.now() < entry.lockedUntil;
      if (!isLocked) this.memStore.delete(userId);
      return ok(isLocked);
    } catch (e) {
      this.logger.warn(`isAccountLocked error (allowing login): ${(e as Error).message}`);
      return ok(false);
    }
  }

  async getRemainingLockoutTime(userId: string): Promise<Result<number, LockoutError>> {
    try {
      if (this.redisAvailable && this.redisClient) {
        const ttl = await this.redisClient.ttl(`lockout:${userId}`);
        return ok(ttl > 0 ? ttl : 0);
      }
      const entry = this.memStore.get(userId);
      if (!entry?.lockedUntil) return ok(0);
      return ok(Math.max(0, Math.ceil((entry.lockedUntil - Date.now()) / 1000)));
    } catch (e) {
      return ok(0);
    }
  }

  async recordFailedAttempt(userId: string): Promise<Result<FailedAttemptResult, LockoutError>> {
    try {
      if (this.redisAvailable && this.redisClient) {
        const attemptsKey = `attempts:${userId}`;
        const attempts = await this.redisClient.incr(attemptsKey);
        if (attempts === 1) {
          await this.redisClient.expire(attemptsKey, this.LOCKOUT_DURATION_SECONDS);
        }
        let isLocked = false;
        if (attempts >= this.MAX_ATTEMPTS) {
          await this.redisClient.set(`lockout:${userId}`, '1', { EX: this.LOCKOUT_DURATION_SECONDS });
          isLocked = true;
        }
        return ok({ attempts, isLocked });
      }
      const entry = this.memStore.get(userId) ?? { attempts: 0, lockedUntil: null };
      entry.attempts += 1;
      let isLocked = false;
      if (entry.attempts >= this.MAX_ATTEMPTS) {
        entry.lockedUntil = Date.now() + this.LOCKOUT_DURATION_SECONDS * 1000;
        isLocked = true;
      }
      this.memStore.set(userId, entry);
      return ok({ attempts: entry.attempts, isLocked });
    } catch (e) {
      this.logger.warn(`recordFailedAttempt error: ${(e as Error).message}`);
      return ok({ attempts: 1, isLocked: false });
    }
  }

  async resetFailedAttempts(userId: string): Promise<Result<void, LockoutError>> {
    try {
      if (this.redisAvailable && this.redisClient) {
        await this.redisClient.del(`attempts:${userId}`, `lockout:${userId}`);
        return ok(undefined);
      }
      this.memStore.delete(userId);
      return ok(undefined);
    } catch (e) {
      this.logger.warn(`resetFailedAttempts error: ${(e as Error).message}`);
      return ok(undefined);
    }
  }
}
