import { UUID } from '@going-monorepo-clean/shared-domain';

export const ITokenService = Symbol('ITokenService');

/**
 * Token response DTO for login/refresh flows
 */
export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

/**
 * Token service interface for generating and validating tokens
 */
export interface ITokenService {
  /**
   * Generate both access and refresh tokens (login)
   * @deprecated Use generateAccessToken + generateRefreshToken separately
   */
  generateAuthToken(userId: UUID, email: string, roles: string[], companyId?: string): string;

  /**
   * Generate short-lived access token (15 minutes).
   * `companyId` se incluye si el usuario pertenece a una empresa corporativa
   * — permite a downstream services derivar clientSegment='corporate'
   * server-side sin confiar en el body del request (auditoría #29).
   */
  generateAccessToken(
    userId: UUID,
    email: string,
    roles: string[],
    companyId?: string,
  ): string;

  /**
   * Generate refresh token (opaque, stored in Redis)
   */
  generateRefreshToken(): string;

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): { sub: UUID; email: string; roles: string[] };

  /**
   * Verify and decode refresh token payload
   */
  verifyRefreshToken(
    token: string,
  ): { sub: UUID; email: string; iat: number; exp: number };

  /**
   * Extract JWT ID (jti) from token for blacklisting
   */
  extractJti(token: string): string | null;

  /**
   * Seconds until the access token expires (opcional; usado para TTL de blacklist)
   */
  getAccessTokenExpirationSeconds?(): number;
}