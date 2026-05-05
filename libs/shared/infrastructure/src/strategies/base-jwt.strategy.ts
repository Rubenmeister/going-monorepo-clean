/**
 * BaseJwtStrategy — shared Passport JWT strategy for all Going microservices.
 *
 * Each service extends this with a one-liner subclass so Passport registers
 * a distinct class per service (avoids DI naming collisions across tests).
 *
 * Validates:
 *   1. Token signature (passport-jwt / jsonwebtoken)
 *   2. Expiration (passport-jwt)
 *
 * Does NOT check the Redis blacklist — that lives only in api-gateway's
 * overridden JwtStrategy which adds the revocation check.
 *
 * Token extraction (priority order):
 *   1. Authorization: Bearer <token>
 *   2. Cookie: accessToken
 *
 * Returns a normalized req.user object compatible with both the old `id`
 * field and the newer `userId` field so callers need no changes:
 *   { userId, id, email, role, roles }
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub?:    string;
  userId?: string;
  email:   string;
  roles?:  string[];
  role?:   string;
  iat?:    number;
  exp?:    number;
}

export interface AuthenticatedUser {
  userId: string;
  /** Alias for userId — kept for backward compatibility with older controllers */
  id:     string;
  email:  string;
  roles:  string[];
  /** First role — convenience shorthand */
  role:   string;
}

@Injectable()
export class BaseJwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => req?.cookies?.accessToken ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const userId = payload.sub ?? payload.userId;
    if (!userId) throw new UnauthorizedException('Invalid token payload');

    const roles = payload.roles ?? (payload.role ? [payload.role] : ['user']);

    return {
      userId,
      id:    userId,
      email: payload.email,
      roles,
      role:  roles[0] ?? 'user',
    };
  }
}
