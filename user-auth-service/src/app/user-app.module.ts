import { Module } from '@nestjs/common';
import { PrismaModule } from '@going-monorepo-clean/prisma-client';
import { AppController } from './app.controller';
import { AuthController } from '../api/auth.controller';
import { AppService } from './app.service';
import { PrismaUserRepository } from '../infrastructure/persistence/prisma-user.repository';
import { BcryptPasswordHasher } from '../infrastructure/security/bcrypt-password.hasher';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
} from '@going-monorepo-clean/domains-user-application';
import {
  I_USER_REPOSITORY,
  IUserRepository,
  IPasswordHasher,
} from '@going-monorepo-clean/domains-user-core';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    {
      provide: I_USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: IPasswordHasher,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (repo: IUserRepository, hasher: IPasswordHasher) => new RegisterUserUseCase(repo, hasher),
      inject: [I_USER_REPOSITORY, IPasswordHasher],
    },
    {
      provide: LoginUserUseCase,
      useFactory: (repo: IUserRepository, hasher: IPasswordHasher) => new LoginUserUseCase(repo, hasher),
      inject: [I_USER_REPOSITORY, IPasswordHasher],
    },
  ],
})
export class UserAppModule {}
