/**
 * Auth Refresh DTOs
 * Request/Response types for token refresh operations
 */

export class RefreshTokenRequestDto {
  /**
   * The refresh token from login response
   * Should be stored securely (httpOnly cookie or secure storage)
   */
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  /**
   * New access token (JWT, 15 minutes validity)
   * Include in Authorization header: Bearer <accessToken>
   */
  accessToken: string;

  /**
   * Token expiration in seconds
   * Client should refresh before this time
   */
  expiresIn: number;

  /**
   * Optional: rotated refresh token
   * Only provided if token rotation occurred (< 1 day remaining)
   * Client should store this for next refresh
   */
  refreshToken?: string;
}

export class LogoutRequestDto {
  /**
   * Refresh token to revoke on logout
   * Optional - if not provided, all user tokens are revoked
   */
  refreshToken?: string;
}

export class LogoutResponseDto {
  /**
   * Logout success message
   */
  message: string;

  /**
   * Number of tokens revoked
   */
  tokensRevoked: number;
}
