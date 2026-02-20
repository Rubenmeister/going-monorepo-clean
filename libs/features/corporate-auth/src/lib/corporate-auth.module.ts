import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLogService } from './services/audit-log.service';
import { RbacService } from './services/rbac.service';
import { TokenService } from './services/token.service';

/**
 * Corporate Authentication Module
 * Provides SSO, RBAC, MFA, and Audit Logging for B2B portal
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
  providers: [AuditLogService, RbacService, TokenService],
  exports: [
    PassportModule,
    JwtModule,
    AuditLogService,
    RbacService,
    TokenService,
  ],
})
export class CorporateAuthModule {}
