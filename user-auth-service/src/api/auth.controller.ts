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
  Res,
  HttpException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import {
  RegisterUserDto,
  RegisterUserUseCase,
  LoginUserDto,
  LoginUserUseCase,
  OAuthLoginUseCase,
  OAuthLoginDto,
} from '@going-monorepo-clean/domains-user-application';
import { CurrentUser } from '@going-monorepo-clean/shared-infrastructure';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { ITokenManager } from '@going-monorepo-clean/domains-user-core';
import { AuditLogService } from '@going-monorepo-clean/domains-audit-application';
import { AccountLockoutService } from '../application/account-lockout.service';

/**
 * Auth Controller
 * Handles all authentication endpoints:
 * - POST /auth/register - Register new user
 * - POST /auth/login - Login and get tokens
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout and revoke tokens
 * - GET /auth/me - Get current user info (protected)
 * - GET /auth/google - Initiate Google OAuth
 * - GET /auth/google/callback - Google OAuth callback
 * - GET /auth/facebook - Initiate Facebook OAuth
 * - GET /auth/facebook/callback - Facebook OAuth callback
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    @Inject(ITokenManager)
    private tokenManager: ITokenManager,
    private readonly auditLogService: AuditLogService,
    private readonly accountLockoutService: AccountLockoutService,
    private readonly oauthLoginUseCase: OAuthLoginUseCase,
  ) {}

  /**
   * Register New User
   * POST /auth/register
   */
  @Post('register')
  @HttpCode(201)
  async register(
    @Body() dto: RegisterUserDto,
    @Req() req: Request
  ): Promise<any> {
    const startTime = Date.now();
    const ip = this.extractIp(req);
    try {
      // 1. Crear el usuario
      const registerResult = await this.registerUserUseCase.execute(dto);
      const userId = (registerResult as any)?.user?.id ?? (registerResult as any)?.id ?? 'unknown';

      // 2. Auto-login: generar token para que la app pueda usarlo inmediatamente
      let loginResult: any = null;
      try {
        loginResult = await this.loginUserUseCase.execute({ email: dto.email, password: dto.password });
      } catch (loginError) {
        this.logger.warn(`Auto-login after register failed: ${loginError instanceof Error ? loginError.message : loginError}`);
      }

      this.auditLogService.recordSuccess(
        userId,
        'user-auth-service',
        ip,
        'REGISTER',
        'users',
        userId,
        Date.now() - startTime,
        undefined,
        { email: dto.email }
      );

      // Devolver resultado del login (con token) si fue exitoso, o solo el id si falló
      return loginResult ? { ...loginResult, userId } : { id: userId };
    } catch (error) {
      this.auditLogService.recordFailure(
        'anonymous',
        'user-auth-service',
        ip,
        'REGISTER',
        'users',
        'unknown',
        Date.now() - startTime,
        error instanceof Error ? error.message : String(error),
        { email: dto.email }
      );
      throw error;
    }
  }

  /**
   * Login User
   * POST /auth/login
   * Returns: { accessToken, refreshToken, expiresIn }
   *
   * SECURITY: Implements account lockout to prevent brute force attacks
   * - Tracks failed login attempts
   * - Locks account after MAX_ATTEMPTS failures
   * - Uses exponential backoff for lockout duration
   * - Returns 429 Too Many Requests if account is locked
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginUserDto, @Req() req: Request): Promise<any> {
    const startTime = Date.now();
    const ip = this.extractIp(req);

    try {
      // TODO: In production, fetch real userId from database first
      // For now, we'll extract from login attempt below
      const tempUserId = `email:${dto.email}`;

      // SECURITY CHECK: Is account locked?
      const isLocked = await this.accountLockoutService.isAccountLocked(
        tempUserId
      );
      if (isLocked) {
        const lockoutUntil =
          await this.accountLockoutService.getLockoutExpiration(tempUserId);
        this.logger.warn(
          `🔐 Login attempt on locked account: email=${dto.email}, ip=${ip}`
        );
        this.auditLogService.recordFailure(
          'anonymous',
          'user-auth-service',
          ip,
          'LOGIN',
          'auth',
          dto.email,
          Date.now() - startTime,
          `Account is locked until ${lockoutUntil?.toISOString()}`,
          { email: dto.email, locked: true }
        );
        throw new HttpException(
          {
            message: `Account is temporarily locked. Try again after ${lockoutUntil?.toLocaleTimeString()}`,
          },
          429
        );
      }

      // Attempt login
      const result = await this.loginUserUseCase.execute(dto);

      // LOGIN SUCCESSFUL: Reset lockout counter
      await this.accountLockoutService.recordSuccessfulLogin(tempUserId);

      this.auditLogService.recordSuccess(
        result.user.id,
        'user-auth-service',
        ip,
        'LOGIN',
        'auth',
        result.user.id,
        Date.now() - startTime,
        undefined,
        { email: dto.email, roles: result.user.roles }
      );

      return result;
    } catch (error) {
      // LOGIN FAILED: Record failed attempt
      const tempUserId = `email:${dto.email}`;
      const failedAttempt =
        await this.accountLockoutService.recordFailedAttempt(
          tempUserId,
          dto.email,
          ip
        );

      // Log the failure with lockout information
      this.auditLogService.recordFailure(
        'anonymous',
        'user-auth-service',
        ip,
        'LOGIN',
        'auth',
        dto.email,
        Date.now() - startTime,
        error instanceof Error ? error.message : String(error),
        {
          email: dto.email,
          attemptCount: failedAttempt.attemptCount,
          isLocked: failedAttempt.isLocked,
          lockoutUntil: failedAttempt.lockoutUntil?.toISOString(),
        }
      );

      // If account was just locked, inform user
      if (failedAttempt.isLocked) {
        this.logger.warn(
          `🔐 Account locked after ${failedAttempt.attemptCount} failed attempts: email=${dto.email}`
        );
        throw new HttpException(
          {
            message: `Too many failed login attempts. Account locked until ${failedAttempt.lockoutUntil?.toLocaleTimeString()}`,
          },
          429
        );
      }

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
        request.refreshToken
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
        `Unexpected error during token refresh: ${
          error instanceof Error ? error.message : String(error)
        }`
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
    @Req() req?: Request
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
          request.refreshToken
        );

        if (revokeResult.isErr()) {
          this.logger.warn(
            `Failed to revoke refresh token: ${revokeResult.error.message}`
          );
          throw new BadRequestException('Failed to logout');
        }

        tokensRevoked = 1;
      } else {
        // Revoke all tokens for the user
        const revokeAllResult = await this.tokenManager.revokeAllRefreshTokens(
          userId,
          'logout'
        );

        if (revokeAllResult.isErr()) {
          this.logger.warn(
            `Failed to revoke all tokens: ${revokeAllResult.error.message}`
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
          'logout'
        );

        if (blacklistResult.isErr()) {
          this.logger.warn(
            `Failed to blacklist access token: ${blacklistResult.error.message}`
          );
        }
      }

      this.logger.debug(
        `User ${userId} logged out successfully, revoked ${tokensRevoked} token(s)`
      );

      this.auditLogService.recordSuccess(
        userId,
        'user-auth-service',
        ip,
        'LOGOUT',
        'auth',
        userId,
        Date.now() - startTime,
        undefined,
        { tokensRevoked }
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
          userId ?? 'anonymous',
          'user-auth-service',
          ip,
          'LOGOUT',
          'auth',
          userId ?? 'unknown',
          Date.now() - startTime,
          error instanceof Error ? error.message : String(error)
        );
        throw error;
      }

      this.logger.error(
        `Unexpected error during logout: ${
          error instanceof Error ? error.message : String(error)
        }`
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
   * Corporate Login
   * POST /auth/corporate/login
   * For enterprise clients — validates user has 'corporate' role and returns companyId
   */
  @Post('corporate/login')
  @HttpCode(200)
  async corporateLogin(@Body() dto: LoginUserDto, @Req() req: Request): Promise<any> {
    const startTime = Date.now();
    const ip = this.extractIp(req);

    try {
      const tempUserId = `email:${dto.email}`;
      const isLocked = await this.accountLockoutService.isAccountLocked(tempUserId);
      if (isLocked) {
        const lockoutUntil = await this.accountLockoutService.getLockoutExpiration(tempUserId);
        throw new HttpException(
          { message: `Account is temporarily locked. Try again after ${lockoutUntil?.toLocaleTimeString()}` },
          429
        );
      }

      const result = await this.loginUserUseCase.execute(dto);

      // Validate corporate role
      const roles: string[] = result?.user?.roles ?? [];
      if (!roles.includes('corporate') && !roles.includes('admin')) {
        throw new UnauthorizedException('Access restricted to corporate accounts');
      }

      await this.accountLockoutService.recordSuccessfulLogin(tempUserId);

      this.auditLogService.recordSuccess(
        result.user.id, 'user-auth-service', ip, 'CORPORATE_LOGIN',
        'auth', result.user.id, Date.now() - startTime, undefined,
        { email: dto.email, companyId: result.user.companyId }
      );

      return {
        ...result,
        companyId: (result.user as any).companyId ?? null,
        companyName: (result.user as any).companyName ?? null,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof HttpException) throw error;
      const tempUserId = `email:${dto.email}`;
      await this.accountLockoutService.recordFailedAttempt(tempUserId, dto.email, ip);
      this.auditLogService.recordFailure(
        'anonymous', 'user-auth-service', ip, 'CORPORATE_LOGIN',
        'auth', dto.email, Date.now() - startTime,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
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
    @CurrentUser('roles') roles: string[]
  ) {
    return {
      userId,
      email,
      roles,
      authenticated: !!userId,
    };
  }

  // ─── Google OAuth ───────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(): void {
    // Passport redirige al usuario a Google automáticamente
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response): Promise<void> {
    const result = await this.oauthLoginUseCase.execute(req.user as OAuthLoginDto);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${result.token}&isNewUser=${result.isNewUser}`
    );
  }

  // ─── Facebook OAuth ─────────────────────────────────────────────────────────

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin(): void {
    // Passport redirige al usuario a Facebook automáticamente
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: any, @Res() res: Response): Promise<void> {
    const result = await this.oauthLoginUseCase.execute(req.user as OAuthLoginDto);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${result.token}&isNewUser=${result.isNewUser}`
    );
  }
}
