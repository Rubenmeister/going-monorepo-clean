import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ParcelController } from './api/parcel.controller';
import {
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
} from '@going-monorepo-clean/domains-parcel-application';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { NearbyDriversService } from './infrastructure/services/nearby-drivers.service';
import { ParcelDispatchGateway } from './infrastructure/gateways/parcel-dispatch.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.PARCEL_DB_URL, {
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
  controllers: [ParcelController],
  providers: [
    CreateParcelUseCase,
    FindParcelsByUserUseCase,
    JwtStrategy,
    NearbyDriversService,
    ParcelDispatchGateway,
  ],
})
export class AppModule {}
