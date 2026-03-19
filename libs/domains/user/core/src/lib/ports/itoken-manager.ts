import { UUID } from '@going-monorepo-clean/shared-domain';
import { Result } from 'neverthrow';

export const ITokenManager = Symbol('ITokenManager');

/**
 * Access Token Response DTO
 */
export interface AccessTokenResponse {
  accessToken: string;
  expiresIn: number; // seconds
}

/**
 * Token Pair (both access and refresh tokens)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // access token expiry in seconds
}

/**
 * Refresh Token Validation Result
 */
export interface RefreshTokenData {
  userId: UUID;
  email: string;
  issuedAt: Date;
  expiresAt: Date;
}

/**
 * Token Manager Interface
 * Orchestrates token lifecycle: creation, refresh, revocation
 */
export interface ITokenManager {
  /**
   * Create a new token pair (access + refresh) for login
   */
  createTokenPair(
    userId: UUID,
    email: string,
    roles: string[],
  ): Promise<Result<TokenPair, Error>>;

  /**
   * Refresh an access token using a valid refresh token
   */
  refreshAccessToken(
    refreshToken: string,
  ): Promise<Result<AccessTokenResponse, Error>>;

  /**
   * Validate a refresh token and get its data
   */
  validateRefreshToken(
    refreshToken: string,
  ): Promise<Result<RefreshTokenData, Error>>;

  /**
   * Revoke a single refresh token (logout)
   */
  revokeRefreshToken(
    refreshToken: string,
  ): Promise<Result<void, Error>>;

  /**
   * Revoke all refresh tokens for a user (password change, etc.)
   */
  revokeAllRefreshTokens(
    userId: UUID,
    reason: string,
  ): Promise<Result<number, Error>>;

  /**
   * Revoke an access token (add to blacklist)
   */
  revokeAccessToken(
    accessToken: string,
    userId: UUID,
    reason: string,
  ): Promise<Result<void, Error>>;

  /**
   * Check if an access token is revoked
   */
  isAccessTokenRevoked(accessToken: string): Promise<Result<boolean, Error>>;
}
