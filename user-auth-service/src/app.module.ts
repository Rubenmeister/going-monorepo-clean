import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestSignatureMiddleware } from '@going-monorepo-clean/shared-infrastructure';
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
import { LoyaltyPointsService } from './application/loyalty-points.service';
import { UserModelSchema, UserSchema } from './infrastructure/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.USER_DB_URL || process.env.MONGO_URL || process.env.DATABASE_URL, {
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
    MongooseModule.forFeature([
      { name: UserModelSchema.name, schema: UserSchema },
    ]),
    InfrastructureModule,
    AuditModule,
  ],
  controllers: [AuthController, HealthController, AdminController],
  providers: [RegisterUserUseCase, LoginUserUseCase, OAuthLoginUseCase, AccountLockoutService, LoyaltyPointsService],
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
