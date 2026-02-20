import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Corporate Authentication Module
 * Provides SSO, RBAC, and MFA support for B2B portal
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
  providers: [
    // Strategies will be registered separately
    // SSOStrategyFactory,
    // MFAService,
    // RBACService,
    // TokenService,
  ],
  exports: [
    PassportModule,
    JwtModule,
    // Service exports will go here
  ],
})
export class CorporateAuthModule {}
