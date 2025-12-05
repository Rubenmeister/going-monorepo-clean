import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule } from '@going-monorepo-clean/prisma-client';

// Domain Ports (symbols and interfaces from user-core)
import { 
  IUserRepository,
  IPasswordHasher,
  ITokenService,
} from '@going-monorepo-clean/domains-user-core';

// Infrastructure Implementations
import { PrismaUserRepository } from './repositories/user.repository';
import { BcryptHasher } from './services/bcrypt.hasher';
import { JwtTokenService } from './services/jwt.token.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'default-secret-change-in-production',
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION') || '1h' },
      }),
    }),
  ],
  providers: [
    { provide: IUserRepository, useClass: PrismaUserRepository },
    { provide: IPasswordHasher, useClass: BcryptHasher },
    { provide: ITokenService, useClass: JwtTokenService },
  ],
  exports: [
    IUserRepository,
    IPasswordHasher,
    ITokenService,
    JwtModule,
  ],
})
export class InfrastructureModule {}