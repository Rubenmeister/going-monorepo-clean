import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * Refresh Token Entity
 * Represents a long-lived refresh token stored in Redis
 * Used to obtain new access tokens without requiring user to log in again
 */
export interface RefreshTokenProps {
  id?: string; // Redis key (optional, auto-generated)
  userId: UUID;
  token: string; // Opaque token value
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  reason?: 'logout' | 'password_change' | 'admin_revoke';
}

export class RefreshToken {
  readonly id?: string;
  readonly userId: UUID;
  readonly token: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly revokedAt?: Date;
  readonly reason?: string;

  private constructor(props: RefreshTokenProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.token = props.token;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.revokedAt = props.revokedAt;
    this.reason = props.reason;
  }

  /**
   * Create a new refresh token
   */
  static create(
    userId: UUID,
    token: string,
    expiresAt: Date,
  ): RefreshToken {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!token || token.length === 0) {
      throw new Error('Token is required');
    }
    if (expiresAt <= new Date()) {
      throw new Error('Expiration must be in the future');
    }

    return new RefreshToken({
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });
  }

  /**
   * Reconstruct from persisted data (e.g., from Redis)
   */
  static restore(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if token has been revoked
   */
  isRevoked(): boolean {
    return !!this.revokedAt;
  }

  /**
   * Check if token is valid (not expired and not revoked)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  /**
   * Revoke the token
   */
  revoke(reason: string = 'logout'): RefreshToken {
    return new RefreshToken({
      ...this,
      revokedAt: new Date(),
      reason,
    });
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
      id: this.id,
      userId: this.userId,
      token: this.token,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      revokedAt: this.revokedAt,
      reason: this.reason,
    };
  }
}
