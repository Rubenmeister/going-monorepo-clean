import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthController } from './api/auth.controller';
import { HealthController } from './api/health.controller';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
} from '@going-monorepo-clean/domains-user-application';
import { AuditModule } from './audit/audit.module';
import { AccountLockoutService } from './application/account-lockout.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.USER_DB_URL),
    InfrastructureModule,
    AuditModule,
  ],
  controllers: [AuthController, HealthController],
  providers: [RegisterUserUseCase, LoginUserUseCase, AccountLockoutService],
})
export class AppModule {}
