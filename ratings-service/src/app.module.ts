import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RatingSchema } from './infrastructure/schemas/rating.schema';
import { DriverProfileSchema } from './infrastructure/schemas/driver-profile.schema';
import { MongoRatingRepository } from './infrastructure/persistence/mongo-rating.repository';
import { MongoDriverProfileRepository } from './infrastructure/persistence/mongo-driver-profile.repository';
import { SubmitRatingUseCase } from './application/use-cases/submit-rating.use-case';
import { ListRatingsUseCase } from './application/use-cases/list-ratings.use-case';
import { UpdateRatingUseCase } from './application/use-cases/update-rating.use-case';
import { DeleteRatingUseCase } from './application/use-cases/delete-rating.use-case';
import { RatingController } from './api/controllers/rating.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  providers: [
    MongoRatingRepository,
    MongoDriverProfileRepository,
    SubmitRatingUseCase,
    ListRatingsUseCase,
    UpdateRatingUseCase,
    DeleteRatingUseCase,
  ],
  controllers: [RatingController],
  exports: [MongoRatingRepository, MongoDriverProfileRepository],
})
export class AppModule {}
