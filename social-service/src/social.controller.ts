import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  private readonly logger = new Logger(SocialController.name);
  constructor(private readonly socialService: SocialService) {}

  /** POST /social/reviews */
  @Post('reviews')
  submitReview(@Body() body: {
    userId: string; targetType: any; targetId: string;
    rating: number; title: string; content: string; photos?: string[]; verified?: boolean;
  }) {
    if (!body.userId || !body.targetId || !body.rating) {
      throw new BadRequestException('userId, targetId, rating, title and content required');
    }
    return this.socialService.submitReview(
      body.userId, body.targetType, body.targetId,
      body.rating, body.title || '', body.content || '',
      body.photos, body.verified || false,
    );
  }

  /** GET /social/reviews/:targetId */
  @Get('reviews/:targetId')
  getReviews(
    @Param('targetId') targetId: string,
    @Query('targetType') targetType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getReviews(targetId, targetType, limit ? parseInt(limit) : 20);
  }

  /** GET /social/rating/:targetId */
  @Get('rating/:targetId')
  getRating(@Param('targetId') targetId: string, @Query('targetType') targetType?: string) {
    return this.socialService.getRating(targetId, targetType || 'DELIVERY');
  }

  /** POST /social/reviews/:reviewId/vote */
  @Post('reviews/:reviewId/vote')
  voteReview(@Param('reviewId') reviewId: string, @Body() body: { helpful: boolean }) {
    return this.socialService.voteReview(reviewId, body.helpful);
  }

  /** POST /social/referrals */
  @Post('referrals')
  createReferral(@Body() body: { referrerId: string }) {
    if (!body.referrerId) throw new BadRequestException('referrerId required');
    return this.socialService.createReferral(body.referrerId);
  }

  /** POST /social/referrals/complete */
  @Post('referrals/complete')
  completeReferral(@Body() body: { referralCode: string; referredUserId: string }) {
    if (!body.referralCode || !body.referredUserId) {
      throw new BadRequestException('referralCode and referredUserId required');
    }
    return this.socialService.completeReferral(body.referralCode, body.referredUserId);
  }

  /** GET /social/referrals/stats */
  @Get('referrals/stats')
  getReferralStats(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId required');
    return this.socialService.getReferralStats(userId);
  }

  /** GET /social/gamification/:userId */
  @Get('gamification/:userId')
  getGamificationStats(@Param('userId') userId: string) {
    return this.socialService.getGamificationStats(userId);
  }

  /** POST /social/achievements/unlock */
  @Post('achievements/unlock')
  unlockAchievement(@Body() body: { userId: string; achievementId: string }) {
    if (!body.userId || !body.achievementId) {
      throw new BadRequestException('userId and achievementId required');
    }
    return this.socialService.unlockAchievement(body.userId, body.achievementId);
  }

  /** GET /social/events */
  @Get('events')
  getActiveEvents() {
    return this.socialService.getActiveEvents();
  }

  /** POST /social/events */
  @Post('events')
  createEvent(@Body() body: {
    name: string; description: string; type: any;
    startDate: string; endDate: string; prize: string; rules: string;
  }) {
    return this.socialService.createEvent(
      body.name, body.description, body.type,
      new Date(body.startDate), new Date(body.endDate),
      body.prize, body.rules,
    );
  }

  /** POST /social/events/:eventId/join */
  @Post('events/:eventId/join')
  joinEvent(@Param('eventId') eventId: string, @Body() body: { userId: string }) {
    if (!body.userId) throw new BadRequestException('userId required');
    return this.socialService.joinEvent(eventId, body.userId);
  }
}
