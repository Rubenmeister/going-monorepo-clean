import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ok, err, Result } from 'neverthrow';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

/**
 * Gateway Token Manager Service
 *
 * Read-only ITokenManager for the API Gateway.
 * Checks the shared Redis blacklist maintained by user-auth-service.
 * Token creation/rotation is NOT supported here (delegated to auth-service).
 *
 * Redis key format: token_blacklist:{sha256_16(jti)}
 * Matches the format used by RedisTokenBlacklistRepository in user-auth-service.
 */
@Injectable()
export class GatewayTokenManagerService {
  private readonly logger = new Logger(GatewayTokenManagerService.name);
  private readonly failClosed: boolean;

  constructor(
    private readonly jwtService: JwtService,
    @Optional() @Inject('REDIS_CLIENT') private readonly redis: any | null,
  ) {
    this.failClosed = process.env.NODE_ENV === 'production';
    if (!redis) {
      this.logger.warn(
        'REDIS_CLIENT not configured — blacklist check disabled (fail-open). ' +
        'Set REDIS_URL to enable token revocation.',
      );
    }
  }

  /**
   * Check if an access token has been revoked (blacklisted).
   * Uses the same Redis key format as user-auth-service.
   */
  async isAccessTokenRevoked(
    accessToken: string,
  ): Promise<Result<boolean, Error>> {
    if (!this.redis) {
      // No Redis: fail-open in dev, fail-closed in prod
      if (this.failClosed) {
        return err(new Error('Redis not configured — cannot verify token revocation'));
      }
      return ok(false);
    }

    try {
      const decoded: any = this.jwtService.decode(accessToken);
      const jti: string | undefined = decoded?.jti;

      if (!jti) {
        // Tokens without JTI cannot be checked against the blacklist.
        // Allow them through — they will expire naturally.
        this.logger.debug('Token has no jti — skipping blacklist check');
        return ok(false);
      }

      const hashedJti = this.hashJti(jti);
      const key = `token_blacklist:${hashedJti}`;

      const exists = await this.redis.exists(key);
      return ok(exists === 1);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      this.logger.error(`Blacklist check failed: ${error.message}`);

      if (this.failClosed) {
        return err(error);
      }
      // dev: fail-open to avoid blocking developers when Redis is down
      return ok(false);
    }
  }

  /** SHA-256 hash of JTI, first 16 hex chars — mirrors user-auth-service */
  private hashJti(jti: string): string {
    return crypto.createHash('sha256').update(jti).digest('hex').slice(0, 16);
  }

  // --- Unsupported operations (token lifecycle is auth-service's responsibility) ---

  async createTokenPair(): Promise<Result<never, Error>> {
    return err(new Error('createTokenPair is not supported on API Gateway'));
  }

  async refreshAccessToken(): Promise<Result<never, Error>> {
    return err(new Error('refreshAccessToken is not supported on API Gateway'));
  }

  async validateRefreshToken(): Promise<Result<never, Error>> {
    return err(new Error('validateRefreshToken is not supported on API Gateway'));
  }

  async revokeRefreshToken(): Promise<Result<void, Error>> {
    this.logger.warn('revokeRefreshToken called on gateway (no-op)');
    return ok(undefined);
  }

  async revokeAllRefreshTokens(): Promise<Result<number, Error>> {
    this.logger.warn('revokeAllRefreshTokens called on gateway (no-op)');
    return ok(0);
  }

  async revokeAccessToken(): Promise<Result<void, Error>> {
    this.logger.warn('revokeAccessToken called on gateway (no-op)');
    return ok(undefined);
  }
}
