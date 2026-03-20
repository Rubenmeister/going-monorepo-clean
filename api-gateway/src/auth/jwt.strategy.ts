import { Injectable, Logger, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ITokenManager } from '@going-monorepo-clean/shared-domain';

/**
 * JWT Strategy for API Gateway
 * Validates incoming JWTs and checks if they're revoked
 *
 * Extracts JWT from:
 * - Authorization header: "Bearer <token>"
 * - Cookies: "accessToken"
 *
 * Validates:
 * - JWT signature (using JWT_SECRET)
 * - JWT expiration
 * - Token not in blacklist (revoked)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('ITokenManager')
    private tokenManager: ITokenManager,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromExtractors([
          (req) => {
            if (req && req.cookies) {
              return req.cookies['accessToken'];
            }
            return null;
          },
        ]),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  /**
   * Validate JWT payload
   * Called after JWT signature verification
   * Additional checks:
   * - Check if token is blacklisted (revoked)
   */
  async validate(req: any, payload: any) {
    try {
      // Extract the token from request
      const token =
        ExtractJwt.fromAuthHeaderAsBearerToken()(req) ||
        (req.cookies && req.cookies['accessToken']);

      if (token) {
        // Check if token is revoked/blacklisted
        const isBlacklistedResult = await this.tokenManager.isAccessTokenRevoked(
          token,
        );

        if (isBlacklistedResult.isErr()) {
          this.logger.error(
            `Error checking token blacklist: ${isBlacklistedResult.error.message}`,
          );
          // On error, deny access (fail secure)
          return null;
        }

        if (isBlacklistedResult.value) {
          this.logger.warn(
            `Access denied: Token revoked for user ${payload.sub || payload.userId}`,
          );
          return null;
        }
      }

      // Store original token for logout/revocation
      const user = {
        userId: payload.sub || payload.userId,
        email: payload.email,
        roles: payload.roles || [],
        accessToken: token, // Store token for logout operations
        iat: payload.iat,
        exp: payload.exp,
      };

      this.logger.debug(`JWT validated for user ${user.userId}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error validating JWT: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}