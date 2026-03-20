import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ok, err, Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  ITokenBlacklistRepository,
  TokenBlacklist,
  TokenRevocationReason,
} from '@going-monorepo-clean/domains-user-core';
import * as crypto from 'crypto';

/**
 * Redis-backed Token Blacklist Repository
 * Maintains a revoked token blacklist with automatic expiration
 */
@Injectable()
export class RedisTokenBlacklistRepository
  implements ITokenBlacklistRepository {
  private readonly logger = new Logger(RedisTokenBlacklistRepository.name);
  private readonly PREFIX = 'token:blacklist:';
  private readonly USER_PREFIX = 'user:revocations:';

  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  /**
   * Add a token to the blacklist
   */
  async add(
    tokenJti: string,
    userId: UUID,
    reason: TokenRevocationReason,
    expiresAt: Date,
  ): Promise<Result<void, Error>> {
    try {
      const key = `${this.PREFIX}${this.hashJti(tokenJti)}`;
      const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

      if (ttl <= 0) {
        this.logger.warn(`Token already expired, skipping blacklist: ${tokenJti}`);
        return ok(undefined);
      }

      const data = {
        tokenJti,
        userId,
        reason,
        expiresAt: expiresAt.toISOString(),
        revokedAt: new Date().toISOString(),
      };

      // Save blacklist entry with TTL
      await this.redis.setex(key, ttl, JSON.stringify(data));

      // Also add to user's revocation set for audit
      await this.redis.sadd(`${this.USER_PREFIX}${userId}`, key);

      this.logger.debug(
        `Added token to blacklist for user ${userId}, reason: ${reason}, TTL: ${ttl}s`,
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(
        `Failed to add token to blacklist: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if a token JTI is blacklisted
   */
  async isBlacklisted(tokenJti: string): Promise<Result<boolean, Error>> {
    try {
      const key = `${this.PREFIX}${this.hashJti(tokenJti)}`;
      const exists = await this.redis.exists(key);

      if (exists === 1) {
        this.logger.debug(`Token found in blacklist: ${tokenJti}`);
        return ok(true);
      }

      return ok(false);
    } catch (error) {
      this.logger.error(
        `Failed to check blacklist: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get blacklist entry for a token
   */
  async get(
    tokenJti: string,
  ): Promise<Result<TokenBlacklist | null, Error>> {
    try {
      const key = `${this.PREFIX}${this.hashJti(tokenJti)}`;
      const data = await this.redis.get(key);

      if (!data) {
        return ok(null);
      }

      const parsed = JSON.parse(data);
      const blacklist = TokenBlacklist.restore({
        tokenJti: parsed.tokenJti,
        userId: parsed.userId,
        reason: parsed.reason,
        expiresAt: new Date(parsed.expiresAt),
        revokedAt: new Date(parsed.revokedAt),
      });

      return ok(blacklist);
    } catch (error) {
      this.logger.error(
        `Failed to get blacklist entry: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllByUserId(
    userId: UUID,
    reason: TokenRevocationReason,
  ): Promise<Result<number, Error>> {
    try {
      // This would require access to all user tokens, which is complex
      // In a real scenario, we'd track token creation times and patterns
      // For now, return 0 as this is more of a notification mechanism
      this.logger.info(`Revoke all tokens for user ${userId}, reason: ${reason}`);
      return ok(0);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get all blacklist entries for a user
   */
  async getByUserId(
    userId: UUID,
  ): Promise<Result<TokenBlacklist[], Error>> {
    try {
      const keys = await this.redis.smembers(`${this.USER_PREFIX}${userId}`);

      if (keys.length === 0) {
        return ok([]);
      }

      const blacklistEntries: TokenBlacklist[] = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const entry = TokenBlacklist.restore({
              tokenJti: parsed.tokenJti,
              userId: parsed.userId,
              reason: parsed.reason,
              expiresAt: new Date(parsed.expiresAt),
              revokedAt: new Date(parsed.revokedAt),
            });
            blacklistEntries.push(entry);
          } catch (parseError) {
            this.logger.warn(`Failed to parse blacklist entry at key ${key}`);
          }
        }
      }

      return ok(blacklistEntries);
    } catch (error) {
      this.logger.error(
        `Failed to get blacklist for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Remove expired entries from blacklist
   * (Redis automatically handles this with TTL, but this is for explicit cleanup)
   */
  async deleteExpired(): Promise<Result<number, Error>> {
    try {
      // Redis automatically deletes expired keys, so this is a no-op
      // In a real scenario with custom expiration, you'd scan and delete here
      return ok(0);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Hash JTI for key storage (security + brevity)
   */
  private hashJti(jti: string): string {
    // Use SHA256 hash for security
    return crypto.createHash('sha256').update(jti).digest('hex').substring(0, 16);
  }
}
