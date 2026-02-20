import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLogService } from './services/audit-log.service';
import { RbacService } from './services/rbac.service';
import { TokenService } from './services/token.service';
import { CorporateUserService } from './services/corporate-user.service';

/**
 * Corporate Authentication Module
 * Provides SSO, RBAC, MFA, Audit Logging, and User Management for B2B portal
 *
 * SECURITY: This module implements:
 * - Mandatory RBAC with database-backed permission checks
 * - Complete audit logging of all access and role changes
 * - User status validation (active/suspended/inactive)
 * - Company-scoped user isolation
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'corporate-auth-secret',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '1h',
        },
      }),
    }),
  ],
  providers: [AuditLogService, RbacService, TokenService, CorporateUserService],
  exports: [
    PassportModule,
    JwtModule,
    AuditLogService,
    RbacService,
    TokenService,
    CorporateUserService,
  ],
})
export class CorporateAuthModule {}
