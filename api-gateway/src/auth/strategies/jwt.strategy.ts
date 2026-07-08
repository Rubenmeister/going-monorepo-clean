import { Injectable, Logger, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ITokenManager } from '@going-monorepo-clean/domains-user-core';

/**
 * JWT Strategy for API Gateway
 *
 * Validates incoming JWTs and checks token revocation against Redis blacklist.
 *
 * Token sources (in priority order):
 * 1. Authorization header: "Bearer <token>"
 * 2. Cookie: "accessToken"
 *
 * Validation steps:
 * 1. Signature verification (passport-jwt)
 * 2. Expiration check (passport-jwt)
 * 3. Blacklist check (GatewayTokenManagerService → Redis)
 *
 * On Redis failure: fail-closed in production, fail-open in development.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('ITokenManager')
    private readonly tokenManager: ITokenManager,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => req?.cookies?.accessToken ?? null,
      ]),
      ignoreExpiration: false,
      // DUAL-VERIFY HS256/RS256 (auditoría #13): el api-gateway es el gatekeeper
      // HTTP — sin esto rechazaba los tokens RS256 antes de reenviar al backend.
      algorithms: ['HS256', 'RS256'],
      secretOrKeyProvider: (
        _req: any,
        rawJwt: string,
        done: (err: Error | null, key?: string) => void,
      ) => {
        try {
          const header = JSON.parse(
            Buffer.from(String(rawJwt).split('.')[0] ?? '', 'base64url').toString('utf8'),
          );
          if (header?.alg === 'RS256') {
            const pub = configService.get<string>('RS256_PUBLIC_KEY');
            if (!pub) return done(new Error('RS256_PUBLIC_KEY no configurada'));
            return done(null, pub.replace(/\\n/g, '\n'));
          }
          return done(null, configService.getOrThrow<string>('JWT_SECRET'));
        } catch (e) {
          return done(e as Error);
        }
      },
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    try {
      const token =
        ExtractJwt.fromAuthHeaderAsBearerToken()(req) ??
        req?.cookies?.accessToken;

      if (!token) {
        throw new UnauthorizedException('Missing bearer token');
      }

      // Blacklist check — uses jti from payload (extracted internally by GatewayTokenManagerService)
      const revokedResult = await this.tokenManager.isAccessTokenRevoked(token);

      if (revokedResult.isErr()) {
        this.logger.error(`Blacklist check failed: ${revokedResult.error.message}`);
        // GatewayTokenManagerService already applies fail-closed/open policy;
        // we re-throw here so the guard receives an error (not null user).
        throw new UnauthorizedException('Token validation unavailable');
      }

      if (revokedResult.value) {
        const userId = payload?.sub ?? payload?.userId;
        this.logger.warn(`Rejected revoked token for user ${userId}`);
        throw new UnauthorizedException('Token revoked');
      }

      // Return user object — shape aligned with BaseJwtStrategy so all
      // services share the same req.user contract. `id` is a backward-compat
      // alias for `userId`; `role` is the first role as a shorthand.
      const userId = payload.sub ?? payload.userId;
      const roles = payload.roles ?? (payload.role ? [payload.role] : ['user']);
      return {
        userId,
        id: userId,
        email: payload.email,
        roles,
        role: roles[0] ?? 'user',
        accessToken: token,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(
        `Error validating JWT: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
