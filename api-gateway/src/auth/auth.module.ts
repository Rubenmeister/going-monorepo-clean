import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GatewayTokenManagerService } from './gateway-token-manager.service';

/**
 * Auth Module for API Gateway
 *
 * Provides:
 * - JwtStrategy: validates token signature, expiration, and blacklist
 * - JwtAuthGuard: protects routes (throws 401, never returns null)
 * - GatewayTokenManagerService: checks Redis blacklist maintained by user-auth-service
 * - REDIS_CLIENT: ioredis instance (optional — if REDIS_URL is not set, blacklist is disabled)
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  providers: [
    // Redis client — optional, only wired when REDIS_URL is present
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (!redisUrl) return null;
        try {
          const { default: Redis } = await import('ioredis');
          const client = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            lazyConnect: true,
            enableOfflineQueue: false,
          });
          await client.connect().catch(() => {
            // Non-fatal: gateway can start without Redis; blacklist will be disabled
          });
          return client;
        } catch {
          return null;
        }
      },
    },
    JwtStrategy,
    JwtAuthGuard,
    GatewayTokenManagerService,
    {
      provide: 'ITokenManager',
      useExisting: GatewayTokenManagerService,
    },
  ],
  exports: [
    JwtStrategy,
    JwtAuthGuard,
    PassportModule,
    JwtModule,
    GatewayTokenManagerService,
    'ITokenManager',
  ],
})
export class AuthModule {}
