import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module'; // Tu módulo de usuarios

@Module({
  imports: [
    // 1. Cargar configuración segura
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Conectar a Base de Datos (Esperando a que cargue la config)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // 3. Tus módulos de negocio
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}