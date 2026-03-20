import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthController } from './api/auth.controller';
import { HealthController } from './api/health.controller';
import { AdminController } from './api/admin.controller';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  OAuthLoginUseCase,
} from '@going-monorepo-clean/domains-user-application';
import { AuditModule } from './audit/audit.module';
import { AccountLockoutService } from './application/account-lockout.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.USER_DB_URL, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      connectionFactory: (conn) => {
        conn.on('connected', () => console.log('MongoDB connected'));
        conn.on('error', (e) => console.error('MongoDB error:', e.message));
        conn.on('disconnected', () => console.warn('MongoDB disconnected'));
        return conn;
      },
    }),
    InfrastructureModule,
    AuditModule,
  ],
  controllers: [AuthController, HealthController, AdminController],
  providers: [RegisterUserUseCase, LoginUserUseCase, OAuthLoginUseCase, AccountLockoutService],
})
export class AppModule {}
