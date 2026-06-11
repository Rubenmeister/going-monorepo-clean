import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestSignatureMiddleware } from '@going-monorepo-clean/shared-infrastructure';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthController } from './api/auth.controller';
import { HealthController } from './api/health.controller';
import { AdminController } from './api/admin.controller';
import { MfaController } from './api/mfa.controller';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  OAuthLoginUseCase,
} from '@going-monorepo-clean/domains-user-application';
import { AuditModule } from './audit/audit.module';
import { AccountLockoutService } from './application/account-lockout.service';
import { LoyaltyPointsService } from './application/loyalty-points.service';
import { MfaService } from './application/mfa.service';
import { UserModelSchema, UserSchema } from './infrastructure/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.USER_DB_URL || process.env.MONGO_URL || process.env.DATABASE_URL, {
      // Base nombrada — sin esto Mongo cae en la default `test` (migración 11-jun-2026)
      dbName: process.env.MONGO_DB_NAME || 'going-user-auth',
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('connected', () => console.log('MongoDB connected'));
        conn.on('error', (e) => console.error('MongoDB error:', e.message));
        conn.on('disconnected', () => console.warn('MongoDB disconnected'));
        return conn;
      },
    }),
    MongooseModule.forFeature([
      { name: UserModelSchema.name, schema: UserSchema },
    ]),
    InfrastructureModule,
    AuditModule,
  ],
  controllers: [AuthController, HealthController, AdminController, MfaController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    OAuthLoginUseCase,
    AccountLockoutService,
    LoyaltyPointsService,
    MfaService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Middleware HMAC para endpoints inter-servicio. Sólo afecta a paths
    // `/auth/internal/*` y `/internal/*`. Si INTERNAL_SERVICE_TOKEN no está
    // set, el middleware fail-closed (401). El endpoint legacy
    // `/auth/internal/points/award` sigue validando X-Internal-Token de
    // forma manual como retro-compat (cinturón + tirantes).
    consumer
      .apply(RequestSignatureMiddleware)
      .forRoutes('auth/internal/*', 'internal/*');
  }
}
