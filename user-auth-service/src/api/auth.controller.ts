import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  Logger,
  BadRequestException,
  UnauthorizedException,
  Inject,
  Ip,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomUUID, timingSafeEqual, randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
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
import { AuthGuard } from '@nestjs/passport';
import { GoogleOauthGuard } from '../infrastructure/oauth/google-oauth.guard';
import { FacebookOauthGuard } from '../infrastructure/oauth/facebook-oauth.guard';
import { OauthStateService } from '../infrastructure/oauth/oauth-state.service';
import { UserDocument, UserModelSchema } from '../infrastructure/user.schema';
import { LoyaltyPointsService } from '../application/loyalty-points.service';
import { MfaService } from '../application/mfa.service';
import * as jwt from 'jsonwebtoken';

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
    private readonly oauthStateService: OauthStateService,
    @InjectModel(UserModelSchema.name)
    private readonly userModel: Model<UserDocument>,
    private readonly loyaltyPointsService: LoyaltyPointsService,
    private readonly mfaService: MfaService,
  ) {}

  // ────────────────────────────────────────────────
  // POST /auth/bootstrap-admin
  // One-shot: crea o resetea un admin con password.
  // Protegido por header x-bootstrap-token == BOOTSTRAP_TOKEN env var.
  // Body: { email, password, firstName?, lastName? }
  // ────────────────────────────────────────────────
  @Post('bootstrap-admin')
  @HttpCode(200)
  async bootstrapAdmin(
    @Req() req: Request,
    @Body() body: { email: string; password: string; firstName?: string; lastName?: string },
  ): Promise<any> {
    const expected = process.env.BOOTSTRAP_TOKEN;
    if (!expected) {
      throw new HttpException('Bootstrap disabled (no BOOTSTRAP_TOKEN env)', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const provided = String(req.headers['x-bootstrap-token'] ?? '');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    if (!body?.email || !body?.password) {
      throw new HttpException('email and password required', HttpStatus.BAD_REQUEST);
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const existing = await this.userModel.findOne({ email: body.email }).exec();

    if (existing) {
      const roles = Array.from(new Set([...(existing.roles ?? []), 'admin']));
      await this.userModel.updateOne(
        { email: body.email },
        {
          $set: {
            passwordHash,
            roles,
            status: 'active',
            firstName: existing.firstName || body.firstName || 'Admin',
            lastName: existing.lastName || body.lastName || 'Root',
          },
          $unset: { passwo_1drdHash: '', passwo_idrdHash: '' },
        },
      ).exec();
      this.logger.warn(`[BOOTSTRAP] Admin reset: ${body.email}`);
      return { ok: true, action: 'reset', email: body.email, roles, status: 'active' };
    }

    const id = randomUUID();
    await this.userModel.create({
      _id: id,
      id,
      email: body.email,
      passwordHash,
      firstName: body.firstName ?? 'Admin',
      lastName: body.lastName ?? 'Root',
      roles: ['admin'],
      status: 'active',
      createdAt: new Date(),
    });
    this.logger.warn(`[BOOTSTRAP] Admin created: ${body.email}`);
    return { ok: true, action: 'created', email: body.email, id };
  }

  /**
   * Resuelve la URL final a la que redirigir tras el callback OAuth.
   *
   * Orden de precedencia:
   *   1. `state` firmado (returnTo del JWT) → validado contra ALLOWED_RETURN_URLS
   *   2. `FRONTEND_URL` + `/auth/callback` como fallback legacy
   *   3. `http://localhost:3000/auth/callback` como último recurso (dev)
   *
   * Devuelve una URL absoluta que YA incluye el path de callback.
   */
  private resolveOauthRedirectUrl(stateParam: string | undefined): string {
    const returnToRaw = this.oauthStateService.verify(stateParam);
    const validated = this.oauthStateService.validateReturnTo(returnToRaw);
    if (validated) return validated;

    const fallback = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${fallback.replace(/\/$/, '')}/auth/callback`;
  }

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

        // If auto-login fails, attempt explicit login
        try {
          loginResult = await this.loginUserUseCase.execute({ email: dto.email, password: dto.password });
        } catch (secondLoginError) {
          throw new HttpException(
            {
              message: 'User registered successfully but authentication failed. Please log in manually.',
              error: secondLoginError instanceof Error ? secondLoginError.message : 'Login failed',
            },
            HttpStatus.CREATED
          );
        }
      }

      try {
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
      } catch (auditError) {
        this.logger.warn(`Audit log failed (non-critical): ${auditError instanceof Error ? auditError.message : auditError}`);
      }

      // Devolver resultado del login (con token) - debe siempre tener token
      if (!loginResult) {
        throw new HttpException(
          {
            message: 'Registration successful but automatic login failed. Please log in manually.',
          },
          HttpStatus.CREATED
        );
      }

      // Normalizar: exponer tanto `token` como `accessToken` para todos los clientes
      const normalized = loginResult as any;
      const authToken = normalized.accessToken || normalized.token;
      return { ...normalized, token: authToken, accessToken: authToken, userId };
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
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Resolve real userId before any lockout check.
    //    If the email doesn't exist we skip account lockout (no account to lock)
    //    but still track by IP to prevent enumeration.
    const existingUser = await this.userModel
      .findOne({ email: normalizedEmail })
      .select('id')
      .lean()
      .exec();
    const resolvedUserId: string | null = (existingUser as any)?.id ?? null;

    // 2. IP-based rate limit (prefix avoids colliding with account keys)
    const ipKey = `ip:${ip}`;
    const ipLocked = await this.accountLockoutService.isAccountLocked(ipKey);
    if (ipLocked) {
      this.logger.warn(`🔐 Login rate-limited by IP: ${ip}`);
      throw new HttpException(
        { message: 'Too many attempts from this address. Try again later.' },
        429
      );
    }

    try {
      // 3. Account-level lockout (only when user exists)
      if (resolvedUserId) {
        const isLocked = await this.accountLockoutService.isAccountLocked(resolvedUserId);
        if (isLocked) {
          const lockoutUntil =
            await this.accountLockoutService.getLockoutExpiration(resolvedUserId);
          this.logger.warn(
            `🔐 Login attempt on locked account: userId=${resolvedUserId}, ip=${ip}`
          );
          this.auditLogService.recordFailure(
            resolvedUserId,
            'user-auth-service',
            ip,
            'LOGIN',
            'auth',
            resolvedUserId,
            Date.now() - startTime,
            `Account locked until ${lockoutUntil?.toISOString()}`,
            { locked: true }
          );
          // Generic message — do not reveal whether the email exists
          throw new HttpException(
            { message: `Account is temporarily locked. Try again after ${lockoutUntil?.toLocaleTimeString()}` },
            429
          );
        }
      }

      // 4. Attempt login
      const result = await this.loginUserUseCase.execute({ ...dto, email: normalizedEmail });

      // 5. Success — reset lockout counters
      if (resolvedUserId) {
        await this.accountLockoutService.recordSuccessfulLogin(resolvedUserId);
      }
      await this.accountLockoutService.recordSuccessfulLogin(ipKey);

      this.auditLogService.recordSuccess(
        result.user.id,
        'user-auth-service',
        ip,
        'LOGIN',
        'auth',
        result.user.id,
        Date.now() - startTime,
        undefined,
        { roles: result.user.roles }
      );

      const normalized = result as any;
      const authToken = normalized.accessToken || normalized.token;

      // 6. Generar refresh token (estrategia A3 — short TTL access +
      // refresh-based revocation). LoginUserUseCase (CORE) solo retorna
      // access token; el TokenManager crea el par access+refresh con
      // persistencia Redis. Usamos el access del TokenManager para que
      // ambos tokens compartan el mismo jti/familia, simplificando revocación.
      // Si TokenManager falla (Redis down), degradamos a solo access del use
      // case — login no debería caer por falta de refresh.
      let refreshToken: string | undefined;
      let accessTokenFinal = authToken;
      let expiresIn: number | undefined;
      try {
        const tokenPairResult = await this.tokenManager.createTokenPair(
          result.user.id,
          result.user.email,
          result.user.roles ?? [],
          (result.user as any).companyId || undefined,
        );
        if (tokenPairResult.isOk()) {
          refreshToken = tokenPairResult.value.refreshToken;
          accessTokenFinal = tokenPairResult.value.accessToken;
          expiresIn = tokenPairResult.value.expiresIn;
        } else {
          this.logger.warn(
            `Login OK but refresh token creation failed: ${tokenPairResult.error.message}. Degradando a access-only.`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `TokenManager.createTokenPair threw: ${err instanceof Error ? err.message : err}. Degradando a access-only.`,
        );
      }

      return {
        ...normalized,
        token: accessTokenFinal,
        accessToken: accessTokenFinal,
        refreshToken,
        expiresIn,
        userId: result.user.id,
      };

    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 429) throw error;

      // 6. Failed attempt — increment by userId (if exists) and by IP
      if (resolvedUserId) {
        const failedAttempt = await this.accountLockoutService.recordFailedAttempt(
          resolvedUserId,
          normalizedEmail,
          ip
        );
        if (failedAttempt.isLocked) {
          this.logger.warn(`🔐 Account locked: userId=${resolvedUserId}`);
          throw new HttpException(
            { message: `Too many failed login attempts. Account locked until ${failedAttempt.lockoutUntil?.toLocaleTimeString()}` },
            429
          );
        }
      }
      // Always track IP failures to prevent enumeration
      await this.accountLockoutService.recordFailedAttempt(ipKey, normalizedEmail, ip);

      this.auditLogService.recordFailure(
        resolvedUserId ?? 'unknown',
        'user-auth-service',
        ip,
        'LOGIN',
        'auth',
        resolvedUserId ?? 'unknown',
        Date.now() - startTime,
        'Invalid credentials',
        {}
      );

      // Generic error — never reveal whether the email exists
      throw new HttpException({ message: 'Invalid credentials' }, 401);
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
  @UseGuards(AuthGuard('jwt'))
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

      // MFA challenge: si el user tiene mfaEnabled, NO devolvemos los tokens
      // reales — devolvemos un mfaToken efímero (5min) que el frontend debe
      // intercambiar en POST /auth/mfa/verify-login junto con el código TOTP.
      const userMfa = await this.userModel
        .findOne({ id: result.user.id })
        .select('mfaEnabled')
        .lean();
      if (userMfa?.mfaEnabled) {
        const mfaToken = jwt.sign(
          {
            sub: result.user.id,
            email: dto.email,
            purpose: 'mfa-challenge',
            companyId: (result.user as any).companyId ?? null,
            roles,
          },
          process.env.JWT_SECRET ?? '',
          { expiresIn: '5m' },
        );
        this.auditLogService.recordSuccess(
          result.user.id, 'user-auth-service', ip, 'CORPORATE_LOGIN',
          'auth', result.user.id, Date.now() - startTime, undefined,
          { email: dto.email, mfaRequired: true },
        );
        return { mfaRequired: true, mfaToken };
      }

      this.auditLogService.recordSuccess(
        result.user.id, 'user-auth-service', ip, 'CORPORATE_LOGIN',
        'auth', result.user.id, Date.now() - startTime, undefined,
        { email: dto.email, companyId: (result.user as any).companyId }
      );

      // Normalizar contrato: incluir `accessToken` además de `token` para
      // compatibilidad con clientes web (frontend-webapp/empresas/auth.ts).
      const normalized = result as any;
      const authToken = normalized.accessToken || normalized.token;
      return {
        ...normalized,
        token: authToken,
        accessToken: authToken,
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
   * MFA verify-login — segundo paso del login cuando el user tiene MFA activado.
   * POST /auth/mfa/verify-login
   * Body: { mfaToken, code }
   *
   * El mfaToken viene del paso anterior (POST /auth/corporate/login con
   * response { mfaRequired:true, mfaToken }). Es un JWT efímero (5min) que
   * solo se acepta aquí. Validamos su firma + purpose='mfa-challenge', después
   * verificamos el code TOTP o recovery contra el user, y emitimos los
   * tokens reales de sesión.
   */
  @Post('mfa/verify-login')
  @HttpCode(200)
  async mfaVerifyLogin(
    @Body() body: { mfaToken?: string; code?: string },
    @Req() req: Request,
  ): Promise<any> {
    const startTime = Date.now();
    const ip = this.extractIp(req);
    if (!body?.mfaToken) throw new BadRequestException('mfaToken requerido');
    if (!body?.code) throw new BadRequestException('code requerido');

    // 1. Validar mfaToken (firma + purpose + exp)
    let payload: any;
    try {
      payload = jwt.verify(body.mfaToken, process.env.JWT_SECRET ?? '');
    } catch {
      throw new UnauthorizedException('mfaToken inválido o expirado');
    }
    if (payload?.purpose !== 'mfa-challenge') {
      throw new UnauthorizedException('mfaToken no es un challenge MFA');
    }
    const userId = String(payload.sub);
    const email = String(payload.email ?? '');

    // 2. Verificar el code (TOTP o recovery one-time)
    const result = await this.mfaService.verifyChallenge(userId, body.code);
    if (!result.valid) {
      // Trato como failed login attempt (rate limiting)
      const tempUserId = `email:${email}`;
      await this.accountLockoutService.recordFailedAttempt(tempUserId, email, ip);
      this.auditLogService.recordFailure(
        userId, 'user-auth-service', ip, 'LOGIN',
        'users', userId, Date.now() - startTime, 'Invalid MFA code',
      );
      throw new UnauthorizedException('Código MFA inválido');
    }

    // 3. Cargar user real y emitir tokens
    const user = await this.userModel.findOne({ id: userId }).lean();
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const tokenResult = await this.tokenManager.createTokenPair(
      user.id as any,
      user.email,
      (user.roles ?? []) as any,
      (user as any).companyId || undefined,
    );
    if (tokenResult.isErr()) {
      throw new UnauthorizedException(tokenResult.error.message);
    }

    this.auditLogService.recordSuccess(
      user.id, 'user-auth-service', ip, 'LOGIN',
      'users', user.id, Date.now() - startTime, undefined,
      { email: user.email, mfaVerified: true },
    );

    const tokens = tokenResult.value as any;
    return {
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles: user.roles,
        companyId: user.companyId ?? null,
        companyName: user.companyName ?? null,
      },
      companyId: user.companyId ?? null,
      companyName: user.companyName ?? null,
    };
  }

  /**
   * Get Current User Info
   * GET /auth/me
   * Requires valid JWT token.
   *
   * Sin `@UseGuards(AuthGuard('jwt'))`, Nest jamás llama a la JwtStrategy
   * y req.user queda undefined → el endpoint devolvía siempre
   * { authenticated: false } aunque el token fuera válido.
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
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

  // ─── Voice preference (Voice Sem 3A) ────────────────────────────────────

  /**
   * GET /auth/internal/voice-preference?phone=<E.164> — endpoint service-to-
   * service (consumido por voice-call-service al inicio de cada llamada
   * Twilio). NO retorna PII — solo language + voice. Protegido por
   * X-Internal-Token (legacy, mismo patrón que /auth/internal/points/award)
   * o HMAC middleware (vía RequestSignatureMiddleware en /internal/*).
   *
   * Si no encuentra user con ese phone, retorna defaults inferred por
   * country code. Esto permite voice-call-service tener idioma correcto
   * incluso para non-users (primera llamada).
   */
  @Get('internal/voice-preference')
  @HttpCode(200)
  async internalGetVoicePreference(
    @Req() req: Request,
    @Body() _body?: unknown,
  ): Promise<{ language: 'es' | 'en' | 'qu'; voice: string | null }> {
    // Auth: X-Internal-Token o middleware HMAC ya validó /auth/internal/*.
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    const provided = req.headers['x-internal-token'] as string | undefined;
    if (expected && provided) {
      const a = Buffer.from(provided, 'utf8');
      const b = Buffer.from(expected, 'utf8');
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new UnauthorizedException('Internal token inválido');
      }
    } else if (expected) {
      // Si hay token configurado y no vino en el request → 401
      throw new UnauthorizedException('Internal token requerido');
    }
    // Si no hay INTERNAL_SERVICE_TOKEN configurado, asumimos que el
    // middleware HMAC ya validó el request (fail-closed allá).

    const phone = String(req.query?.phone ?? '').trim();
    if (!phone) {
      throw new BadRequestException('phone (E.164) requerido');
    }

    const user = await this.userModel
      .findOne({ phone })
      .select('voiceLanguage voiceName phone')
      .lean();

    if (user) {
      return {
        language: (user.voiceLanguage ?? inferLanguageFromPhone(user.phone)) as 'es' | 'en' | 'qu',
        voice: user.voiceName ?? null,
      };
    }
    // No user encontrado — fallback por country code del phone.
    return { language: inferLanguageFromPhone(phone), voice: null };
  }

  /**
   * GET /auth/me/voice-preference — devuelve { language, voice } del user
   * actual. Si no se ha configurado, retorna defaults derivados del país
   * detectado por el phone (EC→es, US→en, fallback es).
   */
  @Get('me/voice-preference')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async getVoicePreference(@CurrentUser('userId') userId: UUID) {
    const u = await this.userModel
      .findOne({ id: userId })
      .select('voiceLanguage voiceName phone')
      .lean();
    if (!u) throw new UnauthorizedException('Usuario no encontrado');
    return {
      language: u.voiceLanguage ?? inferLanguageFromPhone(u.phone),
      voice: u.voiceName ?? null,
      configured: !!u.voiceLanguage,
    };
  }

  /**
   * PUT /auth/me/voice-preference — actualiza { language?, voice? }.
   * `voice` opcional; si se envía debe estar en VALID_VOICES.
   */
  @Put('me/voice-preference')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async updateVoicePreference(
    @CurrentUser('userId') userId: UUID,
    @Body() body: { language?: string; voice?: string | null },
  ) {
    const VALID_LANGS = ['es', 'en', 'qu'] as const;
    const VALID_VOICES = ['alloy', 'shimmer', 'ash', 'coral', 'sage', 'verse', 'ballad', 'marin', 'cedar'];

    const update: Record<string, unknown> = { voicePreferenceUpdatedAt: new Date() };
    if (body.language !== undefined) {
      if (!VALID_LANGS.includes(body.language as any)) {
        throw new BadRequestException(`language debe ser uno de: ${VALID_LANGS.join(', ')}`);
      }
      update.voiceLanguage = body.language;
    }
    if (body.voice !== undefined) {
      if (body.voice === null || body.voice === '') {
        update.voiceName = undefined; // reset a default
      } else if (!VALID_VOICES.includes(body.voice)) {
        throw new BadRequestException(`voice inválida. Opciones: ${VALID_VOICES.join(', ')}`);
      } else {
        update.voiceName = body.voice;
      }
    }
    await this.userModel.updateOne({ id: userId }, { $set: update });
    const u = await this.userModel
      .findOne({ id: userId })
      .select('voiceLanguage voiceName phone')
      .lean();
    return {
      language: u?.voiceLanguage ?? inferLanguageFromPhone(u?.phone),
      voice: u?.voiceName ?? null,
      configured: !!u?.voiceLanguage,
    };
  }

  // ─── Loyalty Points (Tipo B) ───────────────────────────────────────────────

  /**
   * GET /auth/me/points — saldo actual de puntos de fidelidad.
   */
  @Get('me/points')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async getMyPoints(@CurrentUser('userId') userId: UUID) {
    return this.loyaltyPointsService.getBalance(userId);
  }

  /**
   * POST /auth/me/points/award — admin via JWT.
   * Útil desde el panel admin para corregir saldos.
   */
  @Post('me/points/award')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async awardMyPoints(
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('roles') roles: string[],
    @Body() body: { userId: string; points: number; referenceId?: string },
  ) {
    if (!roles?.includes('admin')) {
      throw new UnauthorizedException('Sólo admin puede acreditar puntos');
    }
    if (!body?.userId || !body?.points) {
      throw new BadRequestException('userId y points son requeridos');
    }
    const awarded = await this.loyaltyPointsService.award(
      body.userId,
      body.points,
      body.referenceId,
    );
    return { awarded, userId: body.userId };
  }

  /**
   * POST /auth/internal/points/award — service-to-service.
   *
   * Lo llama payment-service tras completar un viaje. Autenticación por
   * shared secret (header X-Internal-Token = INTERNAL_SERVICE_TOKEN).
   * No usa JWT porque el caller es otro microservicio, no un usuario.
   *
   * Si INTERNAL_SERVICE_TOKEN no está set, el endpoint está deshabilitado
   * (devuelve 401 siempre — fail-closed).
   */
  @Post('internal/points/award')
  @HttpCode(200)
  async internalAwardPoints(
    @Req() req: Request,
    @Body() body: { userId: string; points: number; referenceId?: string },
  ) {
    // Doble cinturón: el RequestSignatureMiddleware ya validó HMAC en
    // `/auth/internal/*`; aquí seguimos validando X-Internal-Token (legacy)
    // para retro-compat con callers que aún no firman. Cuando todos los
    // callers tengan HMAC, este bloque manual se puede borrar.
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    const provided = req.headers['x-internal-token'] as string | undefined;
    if (!expected || !provided) {
      throw new UnauthorizedException('Internal token inválido');
    }
    // Comparación constant-time — evita timing attacks contra el secret.
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Internal token inválido');
    }
    if (!body?.userId || !body?.points) {
      throw new BadRequestException('userId y points son requeridos');
    }
    const awarded = await this.loyaltyPointsService.award(
      body.userId,
      body.points,
      body.referenceId,
    );
    return { awarded, userId: body.userId };
  }

  /**
   * POST /auth/me/points/redeem — el usuario canjea puntos para un viaje.
   * FareEngine valida el tope del 50%; aquí sólo descontamos.
   */
  @Post('me/points/redeem')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async redeemMyPoints(
    @CurrentUser('userId') userId: UUID,
    @Body() body: { points: number; referenceId?: string },
  ) {
    if (!body?.points || body.points <= 0) {
      throw new BadRequestException('points > 0 requerido');
    }
    return this.loyaltyPointsService.redeem(
      userId,
      body.points,
      body.referenceId,
    );
  }

  // ─── Google OAuth ───────────────────────────────────────────────────────────

  /**
   * Inicia el flujo Google OAuth.
   *
   * Se puede llamar con `?returnTo=<url>` para indicar a qué app volver tras el
   * login. Ej: `/auth/google?returnTo=https://admin.goingec.com/auth/callback`.
   *
   * El `returnTo` se firma como JWT y se manda a Google en el parámetro `state`.
   * Si no se envía returnTo, cae al FRONTEND_URL por defecto (retro-compatibilidad).
   */
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  googleLogin(): void {
    // Passport redirige al usuario a Google automáticamente
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response): Promise<void> {
    const result = await this.oauthLoginUseCase.execute(req.user as OAuthLoginDto);
    const redirectBase = this.resolveOauthRedirectUrl(
      typeof req?.query?.state === 'string' ? req.query.state : undefined
    );
    const separator = redirectBase.includes('?') ? '&' : '?';
    res.redirect(
      `${redirectBase}${separator}token=${encodeURIComponent(result.token)}&isNewUser=${result.isNewUser}`
    );
  }

  // ─── Facebook OAuth ─────────────────────────────────────────────────────────

  @Get('facebook')
  @UseGuards(FacebookOauthGuard)
  facebookLogin(): void {
    // Passport redirige al usuario a Facebook automáticamente
  }

  @Get('facebook/callback')
  @UseGuards(FacebookOauthGuard)
  async facebookCallback(@Req() req: any, @Res() res: Response): Promise<void> {
    const result = await this.oauthLoginUseCase.execute(req.user as OAuthLoginDto);
    const redirectBase = this.resolveOauthRedirectUrl(
      typeof req?.query?.state === 'string' ? req.query.state : undefined
    );
    const separator = redirectBase.includes('?') ? '&' : '?';
    res.redirect(
      `${redirectBase}${separator}token=${encodeURIComponent(result.token)}&isNewUser=${result.isNewUser}`
    );
  }

  // ─── Forgot / Reset Password ────────────────────────────────────────────────

  /**
   * POST /auth/forgot-password
   * Genera un token de reset y envía email con el enlace.
   * Siempre responde 200 para no revelar si el correo existe.
   */
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(
    @Body() body: { email: string },
    @Ip() ipRaw: string,
  ): Promise<{ message: string }> {
    if (!body?.email) throw new BadRequestException('email is required');

    const normalizedEmail = body.email.toLowerCase().trim();
    // Rate limit per email — usamos AccountLockoutService con un namespace
    // "reset:" para que NO se mezcle con attempt counts de login. Misma
    // mecánica (5 attempts → lockout exponencial), pero contadores aislados.
    const rateLimitKey = `reset:${normalizedEmail}`;
    const ip = (ipRaw || 'unknown').replace('::ffff:', '');

    try {
      const locked = await this.accountLockoutService.isAccountLocked(rateLimitKey);
      if (locked) {
        // Privacidad: no revelamos que el email está rate-limited. Mismo
        // mensaje de éxito que el flow normal — atacante no distingue.
        this.logger.warn(
          `[forgot-password] rate-limited: email=${normalizedEmail} ip=${ip}`,
        );
        return {
          message:
            'Si existe una cuenta con ese correo, recibirás las instrucciones en breve.',
        };
      }

      const doc = await this.userModel.findOne({ email: normalizedEmail }).exec();

      if (doc) {
        const resetToken = randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

        await this.userModel
          .updateOne(
            { email: normalizedEmail },
            {
              $set: {
                resetPasswordToken: resetToken,
                resetPasswordExpiry: resetExpiry,
              },
            },
          )
          .exec();

        const frontendUrl = process.env.FRONTEND_URL || 'https://goingec.com';
        const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

        await this.sendResetEmail(normalizedEmail, resetLink);
        this.logger.log(`Password reset email sent to ${normalizedEmail}`);
      }

      // Registramos el attempt SIEMPRE (con o sin user). Asi limitamos
      // spammeo + enumeración por email aunque no exista la cuenta — el
      // atacante igual queda lock-out.
      await this.accountLockoutService.recordFailedAttempt(
        rateLimitKey,
        rateLimitKey,
        ip,
      );
    } catch (err) {
      this.logger.error(
        `forgot-password error: ${err instanceof Error ? err.message : err}`,
        err instanceof Error ? err.stack : undefined,
      );
    }

    return {
      message:
        'Si existe una cuenta con ese correo, recibirás las instrucciones en breve.',
    };
  }

  /**
   * POST /auth/reset-password
   * Valida el token y actualiza la contraseña.
   */
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: { token: string; password: string }): Promise<{ message: string }> {
    if (!body?.token || !body?.password) {
      throw new BadRequestException('token and password are required');
    }
    if (body.password.length < 12) {
      throw new BadRequestException('La contraseña debe tener al menos 12 caracteres');
    }

    const doc = await this.userModel.findOne({
      resetPasswordToken: body.token,
      resetPasswordExpiry: { $gt: new Date() },
    }).exec();

    if (!doc) {
      throw new BadRequestException('El enlace es inválido o ha expirado. Solicita uno nuevo.');
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    await this.userModel.updateOne(
      { _id: doc._id },
      {
        $set: { passwordHash, status: 'active' },
        $unset: { resetPasswordToken: '', resetPasswordExpiry: '' },
      },
    ).exec();

    this.logger.log(`Password reset successfully for ${doc.email}`);
    return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  }

  /**
   * Envía el correo de recuperación vía Gmail SMTP.
   * - Default de remitente: goingappecuador@gmail.com (cuenta real de Going).
   * - Falla ruidosamente si falta GMAIL_APP_PASSWORD (antes fallaba en silencio).
   * - Usa SMTP explícito + verify() para diagnosticar credenciales en logs.
   */
  private async sendResetEmail(to: string, resetLink: string): Promise<void> {
    const gmailUser = process.env.GMAIL_USER || 'goingappecuador@gmail.com';
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailPass) {
      this.logger.error('GMAIL_APP_PASSWORD no está configurada. No se puede enviar reset-email.');
      throw new Error('GMAIL_APP_PASSWORD missing');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });

    try {
      await transporter.verify();
    } catch (e) {
      // Maskear contenido del error porque nodemailer a veces incluye el
      // password en error responses (especialmente 535 auth-failed). Solo
      // logueamos el código + categoría, sin string raw del error.
      const err = e as { code?: string; responseCode?: number; command?: string };
      this.logger.error(
        `SMTP verify falló para ${gmailUser} — code=${err.code ?? 'UNKNOWN'} responseCode=${err.responseCode ?? 'n/a'} command=${err.command ?? 'n/a'}`,
      );
      throw new Error('SMTP authentication failed (check GMAIL_APP_PASSWORD)');
    }

    const info = await transporter.sendMail({
      from: `"Going" <${gmailUser}>`,
      replyTo: 'soporte@goingec.com',
      to,
      subject: 'Recupera tu contraseña – Going',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
          <h2 style="color:#0033A0;margin-bottom:8px;">Recupera tu contraseña</h2>
          <p style="color:#444;line-height:1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta Going.</p>
          <p style="color:#444;line-height:1.6;">Haz clic en el botón de abajo. El enlace es válido por <strong>1 hora</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#0033A0;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
            Restablecer contraseña
          </a>
          <p style="color:#888;font-size:13px;">Si no solicitaste este cambio, ignora este correo.</p>
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;"/>
          <p style="color:#aaa;font-size:12px;">Going Ecuador · <a href="https://goingec.com" style="color:#0033A0;">goingec.com</a></p>
        </div>
      `,
    });

    this.logger.log(`Reset email enviado a ${to} (messageId=${info.messageId})`);
  }
}

/**
 * Helper para Voice Sem 3A: infiere idioma por country code del phone.
 * EC (+593), CO, PE, MX, ES, AR, CL → 'es'
 * US, CA, GB, AU, NZ, IE → 'en'
 * Fallback → 'es' (mercado primario Going).
 *
 * NO incluye 'qu' (kichwa) — eso requiere opt-in explícito del usuario,
 * no se asume por geografía.
 */
function inferLanguageFromPhone(phone?: string | null): 'es' | 'en' {
  if (!phone) return 'es';
  const p = phone.replace(/[^\d+]/g, '');
  // Sin '+' al inicio asumimos que ya viene normalizado con código país.
  if (p.startsWith('+1')) return 'en';   // US/CA
  if (p.startsWith('+44')) return 'en';  // UK
  if (p.startsWith('+61')) return 'en';  // AU
  if (p.startsWith('+64')) return 'en';  // NZ
  if (p.startsWith('+353')) return 'en'; // IE
  // Todo lo demás (incluyendo +593 EC) → es
  return 'es';
}
