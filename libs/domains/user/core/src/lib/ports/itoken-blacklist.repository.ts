import { UUID } from '@going-monorepo-clean/shared-domain';
import { Result } from 'neverthrow';
import {
  TokenBlacklist,
  TokenRevocationReason,
} from '../entities/token-blacklist.entity';

export const ITokenBlacklistRepository = Symbol('ITokenBlacklistRepository');

/**
 * Token Blacklist Repository Interface
 * Handles token revocation by maintaining a blacklist in Redis
 */
export interface ITokenBlacklistRepository {
  /**
   * Add a token to the blacklist
   */
  add(
    tokenJti: string,
    userId: UUID,
    reason: TokenRevocationReason,
    expiresAt: Date,
  ): Promise<Result<void, Error>>;

  /**
   * Check if a token JTI is blacklisted
   */
  isBlacklisted(tokenJti: string): Promise<Result<boolean, Error>>;

  /**
   * Get blacklist entry for a token
   */
  get(tokenJti: string): Promise<Result<TokenBlacklist | null, Error>>;

  /**
   * Revoke all tokens for a user (e.g., on password change)
   */
  revokeAllByUserId(
    userId: UUID,
    reason: TokenRevocationReason,
  ): Promise<Result<number, Error>>;

  /**
   * Get all blacklist entries for a user
   */
  getByUserId(userId: UUID): Promise<Result<TokenBlacklist[], Error>>;

  /**
   * Remove expired entries from blacklist
   */
  deleteExpired(): Promise<Result<number, Error>>;
}
