import { UUID } from '@going-monorepo-clean/shared-domain';
import { Result } from 'neverthrow';
import { RefreshToken } from '../entities/refresh-token.entity';

export const IRefreshTokenRepository = Symbol('IRefreshTokenRepository');

/**
 * Refresh Token Repository Interface
 * Handles persistence of refresh tokens in Redis
 */
export interface IRefreshTokenRepository {
  /**
   * Save a new refresh token
   */
  save(refreshToken: RefreshToken): Promise<Result<void, Error>>;

  /**
   * Find a refresh token by its token value
   */
  findByToken(token: string): Promise<Result<RefreshToken | null, Error>>;

  /**
   * Find all valid refresh tokens for a user
   */
  findByUserId(userId: UUID): Promise<Result<RefreshToken[], Error>>;

  /**
   * Revoke a specific refresh token by token value
   */
  revoke(token: string, reason: string): Promise<Result<void, Error>>;

  /**
   * Revoke all refresh tokens for a user (e.g., password change)
   */
  revokeAllByUserId(
    userId: UUID,
    reason: string,
  ): Promise<Result<number, Error>>;

  /**
   * Delete expired refresh tokens
   */
  deleteExpired(): Promise<Result<number, Error>>;

  /**
   * Check if a token exists and is valid
   */
  exists(token: string): Promise<Result<boolean, Error>>;
}
