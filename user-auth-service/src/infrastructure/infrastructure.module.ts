import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
} from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope
import { MongooseUserRepository } from './persistence/mongoose-user.repository';
import {
  UserModelSchema,
  UserSchema,
} from './persistence/schemas/user.schema';
import { BcryptHasher } from './services/bcrypt.hasher';
import { JwtTokenService } from './services/jwt.token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModelSchema.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [
    {
      provide: IUserRepository,
      useClass: MongooseUserRepository,
    },
    {
      provide: IPasswordHasher,
      useClass: BcryptHasher,
    },
    {
      provide: ITokenService,
      useClass: JwtTokenService,
    },
  ],
  exports: [
    IUserRepository,
    IPasswordHasher,
    ITokenService,
  ],
})
export class InfrastructureModule {}