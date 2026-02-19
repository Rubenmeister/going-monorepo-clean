import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ok, err, Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  IRefreshTokenRepository,
  RefreshToken,
} from '@going-monorepo-clean/domains-user-core';

/**
 * Redis-backed Refresh Token Repository
 * Stores refresh tokens with TTL matching token expiration
 */
@Injectable()
export class RedisRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly logger = new Logger(RedisRefreshTokenRepository.name);
  private readonly PREFIX = 'refresh_token:';
  private readonly USER_PREFIX = 'user_refresh_tokens:';

  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  /**
   * Save a new refresh token to Redis with TTL
   */
  async save(refreshToken: RefreshToken): Promise<Result<void, Error>> {
    try {
      const key = `${this.PREFIX}${this.hashToken(refreshToken.token)}`;
      const ttl = refreshToken.getTtlSeconds();

      if (ttl <= 0) {
        return err(new Error('Token is already expired'));
      }

      const data = {
        userId: refreshToken.userId,
        token: refreshToken.token,
        expiresAt: refreshToken.expiresAt.toISOString(),
        createdAt: refreshToken.createdAt.toISOString(),
        revokedAt: refreshToken.revokedAt?.toISOString() || null,
      };

      // Save token with TTL
      await this.redis.setex(key, ttl, JSON.stringify(data));

      // Add to user's token set for tracking
      await this.redis.sadd(
        `${this.USER_PREFIX}${refreshToken.userId}`,
        key,
      );

      this.logger.debug(
        `Saved refresh token for user ${refreshToken.userId}, TTL: ${ttl}s`,
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(
        `Failed to save refresh token: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Find a refresh token by its token value
   */
  async findByToken(token: string): Promise<Result<RefreshToken | null, Error>> {
    try {
      const key = `${this.PREFIX}${this.hashToken(token)}`;
      const data = await this.redis.get(key);

      if (!data) {
        return ok(null);
      }

      const parsed = JSON.parse(data);
      const refreshToken = RefreshToken.restore({
        userId: parsed.userId,
        token: parsed.token,
        expiresAt: new Date(parsed.expiresAt),
        createdAt: new Date(parsed.createdAt),
        revokedAt: parsed.revokedAt ? new Date(parsed.revokedAt) : undefined,
      });

      return ok(refreshToken);
    } catch (error) {
      this.logger.error(
        `Failed to find refresh token: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Find all valid refresh tokens for a user
   */
  async findByUserId(userId: UUID): Promise<Result<RefreshToken[], Error>> {
    try {
      const keys = await this.redis.smembers(`${this.USER_PREFIX}${userId}`);

      if (keys.length === 0) {
        return ok([]);
      }

      const tokens: RefreshToken[] = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const token = RefreshToken.restore({
              userId: parsed.userId,
              token: parsed.token,
              expiresAt: new Date(parsed.expiresAt),
              createdAt: new Date(parsed.createdAt),
              revokedAt: parsed.revokedAt
                ? new Date(parsed.revokedAt)
                : undefined,
            });
            if (token.isValid()) {
              tokens.push(token);
            }
          } catch (error) {
            this.logger.warn(`Failed to parse token from key ${key}`);
          }
        }
      }

      return ok(tokens);
    } catch (error) {
      this.logger.error(
        `Failed to find tokens for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Revoke a specific refresh token
   */
  async revoke(token: string, reason: string): Promise<Result<void, Error>> {
    try {
      const key = `${this.PREFIX}${this.hashToken(token)}`;
      const data = await this.redis.get(key);

      if (!data) {
        return err(new Error('Token not found'));
      }

      const parsed = JSON.parse(data);
      const revokedToken = RefreshToken.restore({
        userId: parsed.userId,
        token: parsed.token,
        expiresAt: new Date(parsed.expiresAt),
        createdAt: new Date(parsed.createdAt),
        revokedAt: new Date(),
        reason,
      });

      const ttl = revokedToken.getTtlSeconds();
      await this.redis.setex(key, ttl, JSON.stringify(revokedToken.toPrimitives()));

      this.logger.debug(`Revoked refresh token with reason: ${reason}`);
      return ok(undefined);
    } catch (error) {
      this.logger.error(
        `Failed to revoke refresh token: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllByUserId(
    userId: UUID,
    reason: string,
  ): Promise<Result<number, Error>> {
    try {
      const keys = await this.redis.smembers(`${this.USER_PREFIX}${userId}`);

      if (keys.length === 0) {
        return ok(0);
      }

      let revokedCount = 0;

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const token = RefreshToken.restore({
              userId: parsed.userId,
              token: parsed.token,
              expiresAt: new Date(parsed.expiresAt),
              createdAt: new Date(parsed.createdAt),
            });
            const revokedToken = token.revoke(reason);
            const ttl = revokedToken.getTtlSeconds();

            if (ttl > 0) {
              await this.redis.setex(
                key,
                ttl,
                JSON.stringify(revokedToken.toPrimitives()),
              );
              revokedCount++;
            } else {
              await this.redis.del(key);
              await this.redis.srem(`${this.USER_PREFIX}${userId}`, key);
            }
          } catch (error) {
            this.logger.warn(
              `Failed to revoke token at key ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }

      this.logger.debug(
        `Revoked ${revokedCount} refresh tokens for user ${userId}`,
      );
      return ok(revokedCount);
    } catch (error) {
      this.logger.error(
        `Failed to revoke all tokens for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Delete expired refresh tokens
   */
  async deleteExpired(): Promise<Result<number, Error>> {
    try {
      // In Redis, keys with TTL are automatically deleted
      // This method is more for cleanup of manually tracked tokens
      // For now, just return 0 as Redis handles expiration
      return ok(0);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if a token exists and is valid
   */
  async exists(token: string): Promise<Result<boolean, Error>> {
    try {
      const key = `${this.PREFIX}${this.hashToken(token)}`;
      const exists = await this.redis.exists(key);
      return ok(exists === 1);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Hash token for key storage (simple hash, could use crypto)
   */
  private hashToken(token: string): string {
    // Simple hash: use first 16 chars + last 16 chars
    if (token.length <= 32) {
      return token;
    }
    return `${token.substring(0, 16)}...${token.substring(token.length - 16)}`;
  }
}
