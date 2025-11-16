import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthController } from './api/auth.controller';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
} from '@going-monorepo-clean/domains-user-application'; // Reemplaza con tu scope

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.USER_DB_URL), // .env
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