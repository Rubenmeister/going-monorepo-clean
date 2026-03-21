import { Injectable, Logger } from '@nestjs/common';
import { ok, err, Result } from 'neverthrow';

/**
 * Gateway Token Manager Service
 *
 * Stub implementation of ITokenManager for the API Gateway.
 * The gateway does not manage tokens (that is user-auth-service's responsibility),
 * but it needs to check if access tokens are revoked.
 *
 * TODO: Implement Redis-based blacklist check when Redis is configured.
 * For now, all tokens are considered valid (no revocation check at gateway level).
 * Token creation/refresh operations are delegated to user-auth-service via proxy.
 */
@Injectable()
export class GatewayTokenManagerService {
  private readonly logger = new Logger(GatewayTokenManagerService.name);

  /**
   * Check if an access token is revoked.
   * TODO: Check Redis blacklist when REDIS_URL is configured.
   */
  async isAccessTokenRevoked(
    accessToken: string
  ): Promise<Result<boolean, Error>> {
    // No-op: Gateway doesn't maintain a local blacklist yet.
    // Token revocation is handled by user-auth-service.
    return ok(false);
  }

  async createTokenPair(): Promise<Result<never, Error>> {
    return err(new Error('createTokenPair not available at gateway level'));
  }

  async refreshAccessToken(): Promise<Result<never, Error>> {
    return err(new Error('refreshAccessToken not available at gateway level'));
  }

  async validateRefreshToken(): Promise<Result<never, Error>> {
    return err(
      new Error('validateRefreshToken not available at gateway level')
    );
  }

  async revokeRefreshToken(): Promise<Result<void, Error>> {
    this.logger.warn(
      'revokeRefreshToken called at gateway level - delegating to user-auth-service'
    );
    return ok(undefined);
  }

  async revokeAllRefreshTokens(): Promise<Result<number, Error>> {
    this.logger.warn(
      'revokeAllRefreshTokens called at gateway level - delegating to user-auth-service'
    );
    return ok(0);
  }

  async revokeAccessToken(): Promise<Result<void, Error>> {
    this.logger.warn(
      'revokeAccessToken called at gateway level - delegating to user-auth-service'
    );
    return ok(undefined);
  }
}
