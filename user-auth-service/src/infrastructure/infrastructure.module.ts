import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  IRefreshTokenRepository,
  ITokenBlacklistRepository,
  ITokenManager,
} from '@going-monorepo-clean/domains-user-core';
import { MongooseUserRepository } from './persistence/mongoose-user.repository';
import { UserModelSchema, UserSchema } from './user.schema';
import { BcryptHasher } from './services/bcrypt.hasher';
import { JwtTokenService } from './services/jwt.token.service';
import { RedisRefreshTokenRepository } from './persistence/redis-refresh-token.repository';
import { RedisTokenBlacklistRepository } from './persistence/redis-token-blacklist.repository';
import { TokenManagerService } from './services/token-manager.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { OauthStateService } from './oauth/oauth-state.service';
import { GoogleOauthGuard } from './oauth/google-oauth.guard';
import { FacebookOauthGuard } from './oauth/facebook-oauth.guard';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: UserModelSchema.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const url = configService.get('REDIS_URL') || 'redis://localhost:6379';
        return new Redis(url, {
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 0,
          connectTimeout: 3000,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: IUserRepository,
      useClass: MongooseUserRepository,
    },
    {
      provide: IPasswordHasher,
      useClass: BcryptHasher,
    },
    {
      provide: ITokenService,
      useClass: JwtTokenService,
    },
    {
      provide: IRefreshTokenRepository,
      useClass: RedisRefreshTokenRepository,
    },
    {
      provide: ITokenBlacklistRepository,
      useClass: RedisTokenBlacklistRepository,
    },
    {
      provide: ITokenManager,
      useClass: TokenManagerService,
    },
    // Security Services
    TokenManagerService,
    AccountLockoutService,
    // OAuth Strategies
    GoogleStrategy,
    FacebookStrategy,
    // OAuth multi-app (state firmado + whitelist)
    OauthStateService,
    GoogleOauthGuard,
    FacebookOauthGuard,
  ],
  exports: [
    IUserRepository,
    IPasswordHasher,
    ITokenService,
    IRefreshTokenRepository,
    ITokenBlacklistRepository,
    ITokenManager,
    TokenManagerService,
    AccountLockoutService,
    JwtModule,
    // Re-exportados para que el controlador los pueda inyectar
    OauthStateService,
    GoogleOauthGuard,
    FacebookOauthGuard,
  ],
})
export class InfrastructureModule {}
