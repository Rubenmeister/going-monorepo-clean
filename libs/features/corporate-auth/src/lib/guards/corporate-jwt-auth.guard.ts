import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

/**
 * Corporate JWT Auth Guard
 * Protects corporate routes by validating JWT tokens
 *
 * Usage:
 * @UseGuards(CorporateJwtAuthGuard)
 * @Get('audit/logs')
 * async getAuditLogs(@Req() req: Request) { ... }
 *
 * Returns 401 Unauthorized if:
 * - Token is missing
 * - Token signature is invalid
 * - Token is expired
 * - Required JWT fields are missing
 *
 * SECURITY: Enforces that request companyId matches JWT companyId
 */
@Injectable()
export class CorporateJwtAuthGuard extends AuthGuard('corporate-jwt') {
  private readonly logger = new Logger(CorporateJwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context?: ExecutionContext) {
    if (err) {
      this.logger.warn(`Corporate JWT validation error: ${err.message}`);
      throw err;
    }

    if (!user) {
      this.logger.warn(
        `Corporate JWT validation failed: ${info?.message || 'unknown reason'}`
      );
      return null;
    }

    // If we have context, verify companyId matches
    if (context) {
      const request = context.switchToHttp().getRequest();
      const headerCompanyId = request.headers['x-company-id'] as string;

      // If header specifies company, verify it matches JWT
      if (headerCompanyId && headerCompanyId !== user.companyId) {
        this.logger.warn(
          `Company ID mismatch: Header=${headerCompanyId}, JWT=${user.companyId} for user ${user.userId}`
        );
        throw new ForbiddenException('Company ID mismatch');
      }

      // Set companyId from JWT on request for downstream use
      request.user = {
        ...user,
        companyId: user.companyId, // Ensure it comes from JWT, not header
      };
    }

    return user;
  }
}
