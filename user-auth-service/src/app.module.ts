import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <--- Importa ConfigService
import { MongooseModule } from '@nestjs/mongoose';
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
    
    // CORRECCIÓN: Usar forRootAsync para esperar a que las variables carguen
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('USER_DB_URL') || 'mongodb://127.0.0.1:27017/going_monorepo',
      }),
      inject: [ConfigService],
    }),
    
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