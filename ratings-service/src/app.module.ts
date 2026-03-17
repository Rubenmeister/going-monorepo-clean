import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { RatingSchema } from './infrastructure/schemas/rating.schema';
import { DriverProfileSchema } from './infrastructure/schemas/driver-profile.schema';
import { MongoRatingRepository } from './infrastructure/persistence/mongo-rating.repository';
import { MongoDriverProfileRepository } from './infrastructure/persistence/mongo-driver-profile.repository';
import { IRatingRepository, IDriverProfileRepository } from './domain/ports';
import { SubmitRatingUseCase } from './application/use-cases/submit-rating.use-case';
import { ListRatingsUseCase } from './application/use-cases/list-ratings.use-case';
import { UpdateRatingUseCase } from './application/use-cases/update-rating.use-case';
import { DeleteRatingUseCase } from './application/use-cases/delete-rating.use-case';
import { RatingController } from './api/controllers/rating.controller';
import { HealthController } from './api/health.controller';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/going_ratings',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: 'Rating', schema: RatingSchema },
      { name: 'DriverProfile', schema: DriverProfileSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'default-secret'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [
    // Repository bindings using Symbol DI tokens
    { provide: IRatingRepository, useClass: MongoRatingRepository },
    { provide: IDriverProfileRepository, useClass: MongoDriverProfileRepository },
    // Use Cases
    SubmitRatingUseCase,
    ListRatingsUseCase,
    UpdateRatingUseCase,
    DeleteRatingUseCase,
    // Auth
    JwtStrategy,
  ],
  controllers: [RatingController, HealthController],
  exports: [IRatingRepository, IDriverProfileRepository],
})
export class AppModule {}
