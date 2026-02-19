import { Injectable, Inject, Logger } from '@nestjs/common';
import { ok, err, Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  ITokenManager,
  ITokenService,
  IRefreshTokenRepository,
  ITokenBlacklistRepository,
  AccessTokenResponse,
  TokenPair,
  RefreshTokenData,
  RefreshToken,
  TokenBlacklist,
} from '@going-monorepo-clean/domains-user-core';

/**
 * Token Manager Service
 * Orchestrates the complete token lifecycle:
 * - Creating token pairs for login
 * - Refreshing access tokens
 * - Revoking tokens on logout
 * - Validating token states
 */
@Injectable()
export class TokenManagerService implements ITokenManager {
  private readonly logger = new Logger(TokenManagerService.name);

  constructor(
    @Inject('ITokenService')
    private tokenService: ITokenService,
    @Inject('IRefreshTokenRepository')
    private refreshTokenRepo: IRefreshTokenRepository,
    @Inject('ITokenBlacklistRepository')
    private blacklistRepo: ITokenBlacklistRepository,
  ) {}

  /**
   * Create a new token pair (access + refresh) for login
   */
  async createTokenPair(
    userId: UUID,
    email: string,
    roles: string[],
  ): Promise<Result<TokenPair, Error>> {
    try {
      // 1. Generate access token (15 minutes)
      const accessToken = this.tokenService.generateAccessToken(
        userId,
        email,
        roles,
      );

      // 2. Generate refresh token (opaque, 7 days)
      const refreshTokenValue = this.tokenService.generateRefreshToken();

      // 3. Calculate expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 4. Create and save refresh token entity
      const refreshToken = RefreshToken.create(userId, refreshTokenValue, expiresAt);
      const saveResult = await this.refreshTokenRepo.save(refreshToken);

      if (saveResult.isErr()) {
        this.logger.error(
          `Failed to save refresh token for user ${userId}: ${saveResult.error.message}`,
        );
        return err(
          new Error('Failed to create refresh token: ' + saveResult.error.message),
        );
      }

      // 5. Return token pair
      const accessTokenExpiresIn = this.tokenService.getAccessTokenExpirationSeconds?.() || 900; // 15 min default

      this.logger.debug(
        `Created token pair for user ${userId}: access token 15m, refresh token 7d`,
      );

      return ok({
        accessToken,
        refreshToken: refreshTokenValue,
        expiresIn: accessTokenExpiresIn,
      });
    } catch (error) {
      this.logger.error(
        `Error creating token pair: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to create token pair'),
      );
    }
  }

  /**
   * Refresh an access token using a valid refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<Result<AccessTokenResponse, Error>> {
    try {
      // 1. Validate refresh token exists and is not revoked
      const tokenResult = await this.refreshTokenRepo.findByToken(refreshToken);

      if (tokenResult.isErr()) {
        this.logger.warn(
          `Error finding refresh token: ${tokenResult.error.message}`,
        );
        return err(new Error('Invalid refresh token'));
      }

      if (!tokenResult.value) {
        this.logger.warn(`Refresh token not found or expired`);
        return err(new Error('Refresh token expired or revoked'));
      }

      const storedToken = tokenResult.value;

      // 2. Check if token is valid (not expired, not revoked)
      if (!storedToken.isValid()) {
        this.logger.warn(
          `Refresh token invalid for user ${storedToken.userId}`,
        );
        return err(
          new Error(
            storedToken.isExpired()
              ? 'Refresh token expired'
              : 'Refresh token revoked',
          ),
        );
      }

      // 3. Get user data (in real scenario, fetch from DB)
      // For now, we'll assume refresh token contains this info or we fetch it
      // This is a simplified version - in production, you'd fetch user details from DB

      // 4. Generate new access token
      // Note: We don't have user email/roles from refresh token in this implementation
      // In production, you'd need to store these or fetch from user DB
      const newAccessToken = this.tokenService.generateAccessToken(
        storedToken.userId,
        '', // Would be fetched from user in production
        [], // Would be fetched from user in production
      );

      // 5. Optionally rotate refresh token if < 1 day remaining
      const ttlSeconds = storedToken.getTtlSeconds();
      const oneDayInSeconds = 86400;
      let newRefreshToken: string | undefined;

      if (ttlSeconds < oneDayInSeconds) {
        // Token rotation: revoke old, create new
        const revokeResult = await this.refreshTokenRepo.revoke(
          refreshToken,
          'rotated',
        );

        if (revokeResult.isErr()) {
          this.logger.warn(
            `Failed to revoke old refresh token during rotation`,
          );
          // Don't fail the request, just continue with old token
        } else {
          // Create new refresh token
          const newExpiresAt = new Date();
          newExpiresAt.setDate(newExpiresAt.getDate() + 7);
          newRefreshToken = this.tokenService.generateRefreshToken();

          const newRefreshTokenEntity = RefreshToken.create(
            storedToken.userId,
            newRefreshToken,
            newExpiresAt,
          );

          const saveResult = await this.refreshTokenRepo.save(
            newRefreshTokenEntity,
          );

          if (saveResult.isErr()) {
            this.logger.warn(`Failed to save rotated refresh token`);
            newRefreshToken = undefined; // Fall back to old token
          }
        }
      }

      const accessTokenExpiresIn = this.tokenService.getAccessTokenExpirationSeconds?.() || 900;

      this.logger.debug(
        `Refreshed access token for user ${storedToken.userId}`,
      );

      return ok({
        accessToken: newAccessToken,
        expiresIn: accessTokenExpiresIn,
      });
    } catch (error) {
      this.logger.error(
        `Error refreshing access token: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to refresh access token'),
      );
    }
  }

  /**
   * Validate a refresh token and get its data
   */
  async validateRefreshToken(
    refreshToken: string,
  ): Promise<Result<RefreshTokenData, Error>> {
    try {
      const tokenResult = await this.refreshTokenRepo.findByToken(refreshToken);

      if (tokenResult.isErr()) {
        return err(new Error(`Failed to validate: ${tokenResult.error.message}`));
      }

      if (!tokenResult.value) {
        return err(new Error('Refresh token not found'));
      }

      const token = tokenResult.value;

      if (!token.isValid()) {
        return err(
          new Error(
            token.isExpired() ? 'Token expired' : 'Token revoked',
          ),
        );
      }

      return ok({
        userId: token.userId,
        email: '', // Would fetch from user DB in production
        issuedAt: token.createdAt,
        expiresAt: token.expiresAt,
      });
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to validate refresh token'),
      );
    }
  }

  /**
   * Revoke a single refresh token (logout)
   */
  async revokeRefreshToken(
    refreshToken: string,
  ): Promise<Result<void, Error>> {
    try {
      const result = await this.refreshTokenRepo.revoke(refreshToken, 'logout');

      if (result.isErr()) {
        this.logger.warn(
          `Failed to revoke refresh token: ${result.error.message}`,
        );
        return err(result.error);
      }

      this.logger.debug(`Revoked refresh token for logout`);
      return ok(undefined);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to revoke refresh token'),
      );
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(
    userId: UUID,
    reason: string,
  ): Promise<Result<number, Error>> {
    try {
      const result = await this.refreshTokenRepo.revokeAllByUserId(
        userId,
        reason,
      );

      if (result.isErr()) {
        this.logger.warn(
          `Failed to revoke all tokens for user ${userId}: ${result.error.message}`,
        );
        return err(result.error);
      }

      this.logger.debug(
        `Revoked all refresh tokens for user ${userId}, reason: ${reason}`,
      );
      return ok(result.value);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to revoke all refresh tokens'),
      );
    }
  }

  /**
   * Revoke an access token by adding to blacklist
   */
  async revokeAccessToken(
    accessToken: string,
    userId: UUID,
    reason: string,
  ): Promise<Result<void, Error>> {
    try {
      // Extract JTI from token
      const jti = this.tokenService.extractJti(accessToken);

      if (!jti) {
        this.logger.warn(`Could not extract JTI from access token`);
        return err(new Error('Invalid token format'));
      }

      // Decode token to get expiration
      try {
        const decoded = this.tokenService.verifyAccessToken(accessToken);
        // In a real implementation, we'd parse the JWT to get exp claim
        // For now, assume 15 min from now
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const result = await this.blacklistRepo.add(
          jti,
          userId,
          reason as any,
          expiresAt,
        );

        if (result.isErr()) {
          this.logger.warn(
            `Failed to blacklist access token: ${result.error.message}`,
          );
          return err(result.error);
        }

        this.logger.debug(`Blacklisted access token for user ${userId}`);
        return ok(undefined);
      } catch (decodeError) {
        // Token might be expired, still add to blacklist with future expiry
        const futureExpiry = new Date();
        futureExpiry.setMinutes(futureExpiry.getMinutes() + 15);

        const result = await this.blacklistRepo.add(
          jti,
          userId,
          reason as any,
          futureExpiry,
        );

        if (result.isErr()) {
          return err(result.error);
        }

        return ok(undefined);
      }
    } catch (error) {
      this.logger.error(
        `Error revoking access token: ${error instanceof Error ? error.message : String(error)}`,
      );
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to revoke access token'),
      );
    }
  }

  /**
   * Check if an access token is revoked
   */
  async isAccessTokenRevoked(
    accessToken: string,
  ): Promise<Result<boolean, Error>> {
    try {
      const jti = this.tokenService.extractJti(accessToken);

      if (!jti) {
        return ok(false); // No JTI, can't check
      }

      const result = await this.blacklistRepo.isBlacklisted(jti);

      if (result.isErr()) {
        this.logger.warn(
          `Error checking blacklist: ${result.error.message}`,
        );
        return err(result.error);
      }

      return ok(result.value);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to check token revocation'),
      );
    }
  }
}
