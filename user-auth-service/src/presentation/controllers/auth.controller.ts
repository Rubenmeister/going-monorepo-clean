import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  Logger,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from '@going-monorepo-clean/shared-infrastructure';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { ITokenManager } from '@going-monorepo-clean/domains-user-core';
import {
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  LogoutRequestDto,
  LogoutResponseDto,
} from '../dtos/auth-refresh.dto';

/**
 * Auth Controller
 * Handles authentication endpoints:
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout and revoke tokens
 * - GET /auth/me - Get current user info (protected)
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject('ITokenManager')
    private tokenManager: ITokenManager,
    private jwtService: JwtService,
  ) {}

  /**
   * Refresh Access Token
   * POST /auth/refresh
   *
   * Takes a refresh token and issues a new access token
   * Implements token rotation if refresh token is near expiry
   *
   * @param request - Contains refreshToken
   * @returns New accessToken + expiresIn + optional rotated refreshToken
   * @throws BadRequestException if refresh token is invalid/expired
   * @throws UnauthorizedException if refresh token is revoked
   */
  @Post('refresh')
  @HttpCode(200)
  async refreshToken(
    @Body() request: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    try {
      // Validate input
      if (!request.refreshToken) {
        this.logger.warn(`Refresh attempt with missing refresh token`);
        throw new BadRequestException('Refresh token is required');
      }

      // Use TokenManager to refresh access token
      const result = await this.tokenManager.refreshAccessToken(
        request.refreshToken,
      );

      // Handle errors
      if (result.isErr()) {
        const errorMsg = result.error.message;

        if (
          errorMsg.includes('expired') ||
          errorMsg.includes('revoked') ||
          errorMsg.includes('invalid')
        ) {
          this.logger.warn(
            `Token refresh failed: ${errorMsg}`,
          );
          throw new UnauthorizedException(errorMsg);
        }

        this.logger.error(`Token refresh error: ${errorMsg}`);
        throw new BadRequestException('Failed to refresh token');
      }

      const response = result.value;

      this.logger.debug(`Successfully refreshed access token`);

      return {
        accessToken: response.accessToken,
        expiresIn: response.expiresIn,
        // refreshToken is optional - only if rotation occurred
      };
    } catch (error) {
      if (error instanceof BadRequestException ||
          error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during token refresh: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to refresh token');
    }
  }

  /**
   * Logout
   * POST /auth/logout
   *
   * Revokes the user's refresh token(s)
   * Adds current access token to blacklist
   *
   * Can specify a specific refresh token or revoke all tokens for the user
   *
   * @param userId - Current user ID (from JWT)
   * @param accessToken - Current access token (from header)
   * @param request - Optional: specific refreshToken to revoke
   * @returns Number of tokens revoked
   */
  @Post('logout')
  @UseGuards() // Assumes JWT guard is applied globally
  @HttpCode(200)
  async logout(
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('accessToken') accessToken: string,
    @Body() request: LogoutRequestDto,
  ): Promise<LogoutResponseDto> {
    try {
      // Validate user
      if (!userId) {
        this.logger.warn(`Logout attempt without user context`);
        throw new UnauthorizedException('User context required');
      }

      let tokensRevoked = 0;

      // 1. Revoke specific refresh token or all tokens
      if (request.refreshToken) {
        // Revoke specific token
        const revokeResult = await this.tokenManager.revokeRefreshToken(
          request.refreshToken,
        );

        if (revokeResult.isErr()) {
          this.logger.warn(
            `Failed to revoke refresh token: ${revokeResult.error.message}`,
          );
          throw new BadRequestException('Failed to logout');
        }

        tokensRevoked = 1;
      } else {
        // Revoke all tokens for the user
        const revokeAllResult = await this.tokenManager.revokeAllRefreshTokens(
          userId,
          'logout',
        );

        if (revokeAllResult.isErr()) {
          this.logger.warn(
            `Failed to revoke all tokens: ${revokeAllResult.error.message}`,
          );
          throw new BadRequestException('Failed to logout');
        }

        tokensRevoked = revokeAllResult.value;
      }

      // 2. Revoke current access token by adding to blacklist
      if (accessToken) {
        const blacklistResult = await this.tokenManager.revokeAccessToken(
          accessToken,
          userId,
          'logout',
        );

        if (blacklistResult.isErr()) {
          this.logger.warn(
            `Failed to blacklist access token: ${blacklistResult.error.message}`,
          );
          // Don't fail the logout if blacklist fails, but log it
        }
      }

      this.logger.debug(
        `User ${userId} logged out successfully, revoked ${tokensRevoked} token(s)`,
      );

      return {
        message: 'Logout successful',
        tokensRevoked,
      };
    } catch (error) {
      if (error instanceof BadRequestException ||
          error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during logout: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to logout');
    }
  }

  /**
   * Get Current User Info
   * GET /auth/me
   *
   * Returns the current authenticated user's information
   * Requires valid JWT token
   *
   * @param userId - Current user ID (from JWT)
   * @param email - Current user email (from JWT)
   * @param roles - Current user roles (from JWT)
   * @returns User info
   */
  @Get('me')
  @UseGuards() // Assumes JWT guard is applied globally
  @HttpCode(200)
  async getCurrentUser(
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('email') email: string,
    @CurrentUser('roles') roles: string[],
  ) {
    return {
      userId,
      email,
      roles,
      authenticated: !!userId,
    };
  }
}
