import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GatewayTokenManagerService } from './gateway-token-manager.service';

/**
 * Auth Module for API Gateway
 * Provides:
 * - JWT Strategy for token validation
 * - JWT Auth Guard for route protection
 * - ITokenManager stub (GatewayTokenManagerService) for token blacklist checking
 *
 * Usage in feature modules:
 * @Module({
 *   imports: [AuthModule],
 * })
 * export class BookingModule { }
 *
 * Usage in controllers:
 * @Controller('bookings')
 * export class BookingController {
 *   @Get()
 *   @UseGuards(JwtAuthGuard)
 *   async list() { ... }
 * }
 */
@Module({
  imports: [
    PassportModule,
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
