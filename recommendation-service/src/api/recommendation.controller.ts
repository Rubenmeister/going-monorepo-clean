import { Controller, Get, Post, Param, Body, Query, Logger } from '@nestjs/common';
import { RecommendationService } from '../application/recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('destinations/:userId')
  async getDestinations(@Param('userId') userId: string) {
    return {
      userId,
      destinations: await this.recommendationService.getDestinations(userId),
    };
  }

  @Get('routes/:userId')
  async getRoutes(@Param('userId') userId: string) {
    return {
      userId,
      routes: await this.recommendationService.getRoutes(userId),
    };
  }

  @Post('history')
  async recordTrip(@Body() body: { userId: string; from: string; to: string; fromLat?: number; fromLng?: number; toLat?: number; toLng?: number; rideId?: string }) {
    return this.recommendationService.recordTrip(body.userId, body);
  }
}
