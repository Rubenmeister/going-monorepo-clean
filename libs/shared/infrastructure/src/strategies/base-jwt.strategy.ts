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
  /**
   * Empresa corporativa a la que pertenece este usuario. Set por user-auth-
   * service al login si el user tiene companyId asociado. Permite a los
   * downstream services derivar `clientSegment='corporate'` server-side sin
   * trust en el body del request (auditoría #29).
   */
  companyId?: string;
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
  /** Empresa corporativa del usuario. Undefined → B2C. Origen: JWT (server-trust). */
  companyId?: string;
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
      // DUAL-VERIFY (auditoría #13): acepta HS256 (secreto compartido, actual) Y
      // RS256 (clave PÚBLICA, futuro). Backward-compatible: hoy todos los tokens
      // son HS256 → cero cambio funcional. Cuando user-auth empiece a firmar RS256
      // (clave privada), estos servicios ya los verifican con la pública sin poder
      // EMITIR. `algorithms` fija los permitidos → no hay confusión de algoritmo.
      algorithms: ['HS256', 'RS256'],
      secretOrKeyProvider: (
        _request: unknown,
        rawJwt: string,
        done: (err: Error | null, key?: string) => void,
      ) => {
        try {
          const header = JSON.parse(
            Buffer.from(String(rawJwt).split('.')[0] ?? '', 'base64url').toString('utf8'),
          );
          if (header?.alg === 'RS256') {
            const pub = configService.get<string>('RS256_PUBLIC_KEY');
            if (!pub) {
              return done(new Error('Token RS256 pero RS256_PUBLIC_KEY no configurada'));
            }
            return done(null, pub.replace(/\\n/g, '\n'));
          }
          return done(null, configService.getOrThrow<string>('JWT_SECRET'));
        } catch (e) {
          return done(e as Error);
        }
      },
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
      companyId: payload.companyId,
    };
  }
}
