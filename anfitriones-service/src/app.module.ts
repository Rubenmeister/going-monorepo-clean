import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AccommodationController } from './api/accommodation.controller';
import {
  CreateAccommodationUseCase,
  GetAccommodationByIdUseCase,
  PublishAccommodationUseCase,
  SearchAccommodationUseCase,
} from '@going-monorepo-clean/domains-accommodation-application';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.ACCOMMODATION_DB_URL, {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'default-secret'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    InfrastructureModule,
  ],
  controllers: [AccommodationController],
  providers: [
    CreateAccommodationUseCase,
    GetAccommodationByIdUseCase,
    PublishAccommodationUseCase,
    SearchAccommodationUseCase,
    JwtStrategy,
  ],
})
export class AppModule {}
