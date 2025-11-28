// apps/user-auth-service/src/infrastructure/infrastructure.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// IMPORTANTE: Importamos tanto la Clase (UserModel) como el Schema (UserModelSchema)
import { UserModel, UserModelSchema } from './persistence/schemas/user.schema';

import { MongooseUserRepository } from './persistence/mongoose-user.repository';
import { BcryptHasher } from './services/bcrypt.hasher';
import { JwtTokenService } from './services/jwt.token.service';

@Module({
  imports: [
    // CORRECCIÓN CRÍTICA:
    // Mongoose 10+ requiere el nombre de la CLASE (UserModel.name), no del schema.
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserModelSchema },
    ]),
    
    // Configuración de JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION') || '1h' },
      }),
    }),
  ],
  providers: [
    // Registramos los servicios de infraestructura
    MongooseUserRepository,
    BcryptHasher,
    JwtTokenService,
    
    // Si en tu AppModule usas inyección por tokens (ej. 'IUserRepository'), 
    // descomenta y ajusta esto:
    // { provide: 'IUserRepository', useClass: MongooseUserRepository },
    // { provide: 'IPasswordHasher', useClass: BcryptHasher },
    // { provide: 'ITokenService', useClass: JwtTokenService },
  ],
  exports: [
    // Exportamos para que el AppModule pueda usarlos
    MongooseUserRepository,
    BcryptHasher,
    JwtTokenService,
    MongooseModule, // Exportamos Mongoose por si acaso
    JwtModule,
  ],
})
export class InfrastructureModule {}