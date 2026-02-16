import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthController } from './api/auth.controller';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
} from '@going-monorepo-clean/domains-user-application';
import { JwtAuthGuard } from '@going-monorepo-clean/shared-domain';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.USER_DB_URL),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    InfrastructureModule,
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}