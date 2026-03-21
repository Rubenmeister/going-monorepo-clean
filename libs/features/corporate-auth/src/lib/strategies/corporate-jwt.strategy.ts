import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CorporateJWTPayload } from '../../interfaces/corporate-user.interface';

/**
 * Corporate JWT Strategy
 * Validates JWT tokens for corporate users
 *
 * Extracts JWT from:
 * - Authorization header: "Bearer <token>"
 * - Cookies: "accessToken"
 *
 * Validates:
 * - JWT signature (using JWT_SECRET)
 * - JWT expiration
 * - Required fields: userId, companyId, email, role
 */
@Injectable()
export class CorporateJwtStrategy extends PassportStrategy(
  Strategy,
  'corporate-jwt'
) {
  private readonly logger = new Logger(CorporateJwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
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
      secretOrKey: configService.get('JWT_SECRET') || 'corporate-auth-secret',
      passReqToCallback: false,
    });
  }

  /**
   * Validate JWT payload for corporate user
   * Called after JWT signature verification
   *
   * SECURITY: Ensures all required fields are present
   */
  async validate(payload: CorporateJWTPayload) {
    try {
      // Validate required fields
      if (!payload.userId) {
        this.logger.warn(`Invalid JWT: missing userId`);
        return null;
      }

      if (!payload.companyId) {
        this.logger.warn(
          `Invalid JWT: missing companyId for user ${payload.userId}`
        );
        return null;
      }

      if (!payload.email) {
        this.logger.warn(
          `Invalid JWT: missing email for user ${payload.userId}`
        );
        return null;
      }

      if (!payload.role) {
        this.logger.warn(
          `Invalid JWT: missing role for user ${payload.userId}`
        );
        return null;
      }

      // Create user object from JWT payload
      const user = {
        userId: payload.userId,
        companyId: payload.companyId,
        email: payload.email,
        role: payload.role,
        ssoProvider: payload.ssoProvider || 'none',
        iat: payload.iat,
        exp: payload.exp,
      };

      this.logger.debug(
        `Corporate JWT validated for user ${user.userId} in company ${user.companyId}`
      );
      return user;
    } catch (error) {
      this.logger.error(
        `Error validating corporate JWT: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }
}
