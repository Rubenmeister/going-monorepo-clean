import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  IRefreshTokenRepository,
  ITokenBlacklistRepository,
  ITokenManager,
} from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope
import { MongooseUserRepository } from './persistence/mongoose-user.repository';
import {
  UserModelSchema,
  UserSchema,
} from './persistence/schemas/user.schema';
import { BcryptHasher } from './services/bcrypt.hasher';
import { JwtTokenService } from './services/jwt.token.service';
import { RedisRefreshTokenRepository } from './persistence/redis-refresh-token.repository';
import { RedisTokenBlacklistRepository } from './persistence/redis-token-blacklist.repository';
import { TokenManagerService } from './services/token-manager.service';

@Module({
  imports: [
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
    TokenManagerService, // Also provide by class for @Inject
  ],
  exports: [
    IUserRepository,
    IPasswordHasher,
    ITokenService,
    IRefreshTokenRepository,
    ITokenBlacklistRepository,
    ITokenManager,
    TokenManagerService,
  ],
})
export class InfrastructureModule {}