import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <--- Importa ConfigService
import { DatabaseModule } from '../../../libs/shared/src';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthController } from './api/auth.controller';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
} from '@going-monorepo-clean/domains-user-application';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env' // Asegura que lea el archivo correcto
    }),
    
    DatabaseModule,
    
    InfrastructureModule,
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