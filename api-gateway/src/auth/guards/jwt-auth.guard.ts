import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 * Protects routes by validating JWT tokens.
 *
 * Returns 401 Unauthorized if:
 * - Token is missing
 * - Token signature is invalid
 * - Token is expired
 * - Token is revoked (blacklisted)
 *
 * IMPORTANT: handleRequest must throw — never return null — or protected
 * routes receive req.user = null and may leak data silently.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      this.logger.warn(`JWT validation error: ${err?.message ?? err}`);
      throw err instanceof Error ? err : new UnauthorizedException(String(err));
    }

    if (!user) {
      const reason = info?.message ?? 'missing or invalid credentials';
      this.logger.warn(`JWT validation failed: ${reason}`);
      throw new UnauthorizedException(reason);
    }

    return user;
  }
}
