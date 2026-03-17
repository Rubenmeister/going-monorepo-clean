import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TourController } from './api/tour.controller';
import { HealthController } from './api/health.controller';
import {
  CreateTourUseCase,
  GetTourByIdUseCase,
  PublishTourUseCase,
  SearchToursUseCase,
} from '@going-monorepo-clean/domains-tour-application';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.TOURS_DB_URL, {
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
  controllers: [TourController, HealthController],
  providers: [
    CreateTourUseCase,
    GetTourByIdUseCase,
    PublishTourUseCase,
    SearchToursUseCase,
    JwtStrategy,
  ],
})
export class AppModule {}
