import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Global() // <--- Importante: Esto hace que no tengas que importarlo en cada sub-módulo
@Module({
  imports: [
    // Cargamos las variables de entorno globalmente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', 
    }),
    // Configuración única de Mongoose para todos los servicios
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // Busca la variable MONGO_URI, si no está, usa la local por defecto
        uri: configService.get<string>('MONGO_URI') || 'mongodb://localhost:27017/going_monorepo',
        retryAttempts: 3,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule, ConfigModule],
})
export class DatabaseModule {}