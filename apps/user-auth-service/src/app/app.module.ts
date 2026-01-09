import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Infrastructure module with Prisma
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

// API Controllers
import { AuthController } from '../api/auth.controller';

// Application layer - Use Cases
import {
  RegisterUserUseCase,
  LoginUserUseCase,
} from '@going-monorepo-clean/domains-user-application';
import { SharedLoggerModule } from '@going-monorepo/shared-backend';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env'
    }),
    InfrastructureModule,
    SharedLoggerModule,
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
  ],
})
export class AppModule {}