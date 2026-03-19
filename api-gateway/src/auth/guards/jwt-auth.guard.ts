import { Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 * Protects routes by validating JWT tokens
 *
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * async getProfile() { ... }
 *
 * Returns 401 Unauthorized if:
 * - Token is missing
 * - Token signature is invalid
 * - Token is expired
 * - Token is revoked (blacklisted)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context: any) {
    if (err) {
      this.logger.warn(`JWT validation error: ${err.message}`);
      throw err;
    }

    if (!user) {
      this.logger.warn(
        `JWT validation failed: ${info?.message || 'unknown reason'}`,
      );
      return null;
    }

    return user;
  }
}
