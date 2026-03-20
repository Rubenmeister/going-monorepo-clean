import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * Token Blacklist Entity
 * Represents a revoked JWT token that should no longer be accepted
 * Stored in Redis with expiration matching the token's JWT exp claim
 */
export type TokenRevocationReason =
  | 'logout'
  | 'password_change'
  | 'role_change'
  | 'admin_revoke'
  | 'account_locked'
  | 'session_terminated';

export interface TokenBlacklistProps {
  tokenJti: string; // JWT ID (jti claim) or token hash
  userId: UUID;
  reason: TokenRevocationReason;
  expiresAt: Date;
  revokedAt: Date;
}

export class TokenBlacklist {
  readonly tokenJti: string;
  readonly userId: UUID;
  readonly reason: TokenRevocationReason;
  readonly expiresAt: Date;
  readonly revokedAt: Date;

  private constructor(props: TokenBlacklistProps) {
    this.tokenJti = props.tokenJti;
    this.userId = props.userId;
    this.reason = props.reason;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
  }

  /**
   * Create a new token blacklist entry
   */
  static create(
    tokenJti: string,
    userId: UUID,
    reason: TokenRevocationReason,
    expiresAt: Date,
  ): TokenBlacklist {
    if (!tokenJti || tokenJti.length === 0) {
      throw new Error('Token JTI is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (expiresAt <= new Date()) {
      throw new Error('Token should still be valid to blacklist');
    }

    return new TokenBlacklist({
      tokenJti,
      userId,
      reason,
      expiresAt,
      revokedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persisted data (e.g., from Redis)
   */
  static restore(props: TokenBlacklistProps): TokenBlacklist {
    return new TokenBlacklist(props);
  }

  /**
   * Check if token expiration has passed
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Get remaining TTL in seconds
   */
  getTtlSeconds(): number {
    const now = new Date().getTime();
    const expiry = this.expiresAt.getTime();
    return Math.max(0, Math.floor((expiry - now) / 1000));
  }

  /**
   * Convert to primitive representation for storage
   */
  toPrimitives() {
    return {
      tokenJti: this.tokenJti,
      userId: this.userId,
      reason: this.reason,
      expiresAt: this.expiresAt,
      revokedAt: this.revokedAt,
    };
  }
}
