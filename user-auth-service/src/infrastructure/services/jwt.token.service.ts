import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as jwtDecode from 'jwt-decode';
import { ITokenService } from '@going-monorepo-clean/domains-user-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * JWT Token Service Implementation
 * Handles generation and validation of access tokens and refresh tokens
 */
@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenExpiration =
      configService.get('JWT_ACCESS_TOKEN_EXPIRES_IN') || '15m';
    this.refreshTokenExpiration =
      configService.get('JWT_REFRESH_TOKEN_EXPIRES_IN') || '7d';
  }

  /**
   * Generate both access and refresh tokens (backward compatibility)
   * @deprecated Use generateAccessToken instead for new implementations
   */
  generateAuthToken(userId: UUID, email: string, roles: string[]): string {
    // For now, generate access token for backward compatibility
    return this.generateAccessToken(userId, email, roles);
  }

  /**
   * Generate short-lived access token (15 minutes)
   * Contains user identity and roles for authorization
   */
  generateAccessToken(
    userId: UUID,
    email: string,
    roles: string[],
  ): string {
    const jti = uuidv4(); // JWT ID for revocation tracking
    const payload = {
      jti,
      sub: userId,
      email,
      roles,
      type: 'access',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiration,
    });

    this.logger.debug(
      `Generated access token for user ${email} with jti ${jti}`,
    );
    return token;
  }

  /**
   * Generate opaque refresh token (7 days)
   * Used to obtain new access tokens without re-authentication
   * Note: The token value itself is stored separately in Redis
   */
  generateRefreshToken(): string {
    // Generate a random opaque token (will be stored in Redis)
    return `rt_${uuidv4().replace(/-/g, '')}_${Date.now()}`;
  }

  /**
   * Verify and decode access token
   * Throws error if token is invalid or expired
   */
  verifyAccessToken(token: string): { sub: UUID; email: string; roles: string[] } {
    try {
      const decoded = this.jwtService.verify(token);

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        sub: decoded.sub,
        email: decoded.email,
        roles: decoded.roles || [],
      };
    } catch (error) {
      this.logger.warn(
        `Failed to verify access token: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Verify and decode refresh token payload
   * Note: This assumes refresh token contains JWT claims (for validation)
   * In reality, refresh tokens are stored in Redis as opaque strings
   */
  verifyRefreshToken(
    token: string,
  ): { sub: UUID; email: string; iat: number; exp: number } {
    try {
      // In a real implementation, this would validate against Redis
      // For now, we decode assuming it could be a JWT
      const decoded = jwtDecode.default(token);

      return {
        sub: decoded.sub,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to verify refresh token: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Extract JWT ID (jti) from token for blacklisting
   * Returns null if jti is not present or token is invalid
   */
  extractJti(token: string): string | null {
    try {
      const decoded = jwtDecode.default<{ jti?: string }>(token);
      return decoded.jti || null;
    } catch {
      return null;
    }
  }

  /**
   * Get access token expiration in seconds
   */
  getAccessTokenExpirationSeconds(): number {
    const expiresIn = this.accessTokenExpiration;
    return this.parseExpirationToSeconds(expiresIn);
  }

  /**
   * Parse expiration string to seconds
   * Supports formats like "15m", "7d", "3600", etc.
   */
  private parseExpirationToSeconds(expiresIn: string): number {
    const match = String(expiresIn).match(/^(\d+)([smhd])$/);
    if (!match) {
      // If it's just a number, assume seconds
      const seconds = parseInt(expiresIn, 10);
      return isNaN(seconds) ? 3600 : seconds;
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 's':
        return numValue;
      case 'm':
        return numValue * 60;
      case 'h':
        return numValue * 3600;
      case 'd':
        return numValue * 86400;
      default:
        return 3600;
    }
  }
}