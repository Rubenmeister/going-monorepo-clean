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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  RegisterUserDto,
  RegisterUserUseCase,
  LoginUserDto,
  LoginUserUseCase,
} from '@going-monorepo-clean/domains-user-application';
import { CurrentUser } from '@going-monorepo-clean/shared-infrastructure';
import { UUID, ITokenManager } from '@going-monorepo-clean/shared-domain';
import { AuditLogService } from '@going-monorepo-clean/domains-audit-application';

/**
 * Auth Controller
 * Handles all authentication endpoints:
 * - POST /auth/register - Register new user
 * - POST /auth/login - Login and get tokens
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout and revoke tokens
 * - GET /auth/me - Get current user info (protected)
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    @Inject('ITokenManager')
    private tokenManager: ITokenManager,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Register New User
   * POST /auth/register
   */
  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterUserDto, @Req() req: Request): Promise<any> {
    const startTime = Date.now();
    const ip = this.extractIp(req);
    try {
      const result = await this.registerUserUseCase.execute(dto);
      this.auditLogService.recordSuccess(
        result?.user?.id ?? 'unknown',
        'user-auth-service', ip, 'REGISTER', 'users',
        result?.user?.id ?? 'unknown', Date.now() - startTime,
        undefined, { email: dto.email },
      );
      return result;
    } catch (error) {
      this.auditLogService.recordFailure(
        'anonymous', 'user-auth-service', ip, 'REGISTER', 'users',
        'unknown', Date.now() - startTime,
        error instanceof Error ? error.message : String(error),
        { email: dto.email },
      );
      throw error;
    }
  }

  /**
   * Login User
   * POST /auth/login
   * Returns: { accessToken, refreshToken, expiresIn }
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginUserDto, @Req() req: Request): Promise<any> {
    const startTime = Date.now();
    const ip = this.extractIp(req);
    try {
      const result = await this.loginUserUseCase.execute(dto);
      this.auditLogService.recordSuccess(
        result.user.id, 'user-auth-service', ip,
        'LOGIN', 'auth', result.user.id, Date.now() - startTime,
        undefined, { email: dto.email, roles: result.user.roles },
      );
      return result;
    } catch (error) {
      this.auditLogService.recordFailure(
        'anonymous', 'user-auth-service', ip, 'LOGIN', 'auth',
        dto.email, Date.now() - startTime,
        error instanceof Error ? error.message : String(error),
        { email: dto.email },
      );
      throw error;
    }
  }

  /**
   * Refresh Access Token
   * POST /auth/refresh
   *
   * Takes a refresh token and issues a new access token
   * Implements token rotation if refresh token is near expiry
   */
  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@Body() request: { refreshToken: string }): Promise<any> {
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
          this.logger.warn(`Token refresh failed: ${errorMsg}`);
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
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during token refresh: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to refresh token');
    }
  }

  /**
   * Logout User
   * POST /auth/logout
   *
   * Revokes the user's refresh token(s) and blacklists access token
   */
  @Post('logout')
  @HttpCode(200)
  async logout(
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('accessToken') accessToken: string,
    @Body() request?: { refreshToken?: string },
    @Req() req?: Request,
  ): Promise<any> {
    const startTime = Date.now();
    const ip = this.extractIp(req);
    try {
      // Validate user
      if (!userId) {
        this.logger.warn(`Logout attempt without user context`);
        throw new UnauthorizedException('User context required');
      }

      let tokensRevoked = 0;

      // 1. Revoke specific refresh token or all tokens
      if (request?.refreshToken) {
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
        }
      }

      this.logger.debug(
        `User ${userId} logged out successfully, revoked ${tokensRevoked} token(s)`,
      );

      this.auditLogService.recordSuccess(
        userId, 'user-auth-service', ip, 'LOGOUT', 'auth',
        userId, Date.now() - startTime,
        undefined, { tokensRevoked },
      );

      return {
        message: 'Logout successful',
        tokensRevoked,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        this.auditLogService.recordFailure(
          userId ?? 'anonymous', 'user-auth-service', ip, 'LOGOUT', 'auth',
          userId ?? 'unknown', Date.now() - startTime,
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      }

      this.logger.error(
        `Unexpected error during logout: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to logout');
    }
  }

  /** Extract real client IP honouring reverse-proxy headers */
  private extractIp(req?: Request): string {
    if (!req) return 'unknown';
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string') return realIp;
    return req.socket?.remoteAddress ?? 'unknown';
  }

  /**
   * Get Current User Info
   * GET /auth/me
   * Requires valid JWT token
   */
  @Get('me')
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