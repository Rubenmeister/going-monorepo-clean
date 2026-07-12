import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  BadRequestException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { SocialService } from './social.service';
import {
  JwtAuthGuard,
  AdminGuard,
  InternalServiceGuard,
  CurrentUser,
} from './infrastructure/auth/jwt.guard';

/**
 * SocialController — reseñas, referidos, gamificación, puntos.
 *
 * Bloque 3: la identidad SIEMPRE sale del JWT verificado (@CurrentUser), nunca
 * del body/header/param controlado por el cliente. Las acciones de SISTEMA
 * (otorgar puntos, desbloquear logros, completar referidos) exigen X-Internal-Token.
 * Las lecturas por :userId solo se permiten a ese usuario o a un admin.
 */
@Controller('social')
export class SocialController {
  private readonly logger = new Logger(SocialController.name);
  constructor(private readonly socialService: SocialService) {}

  private assertSelfOrAdmin(user: any, userId: string): void {
    const roles: string[] = user?.roles ?? [];
    if (String(user?.id) !== String(userId) && !roles.includes('admin')) {
      throw new ForbiddenException('No puedes acceder a datos de otro usuario');
    }
  }

  // ── Reseñas ─────────────────────────────────────────────────────────
  /** POST /social/reviews — autor = JWT; 'verified' solo lo fija el sistema. */
  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  submitReview(
    @CurrentUser() user: any,
    @Body() body: {
      targetType: any; targetId: string; rating: number;
      title?: string; content?: string; photos?: string[];
    },
  ) {
    if (!body.targetId || !body.rating) {
      throw new BadRequestException('targetId and rating required');
    }
    return this.socialService.submitReview(
      user.id, body.targetType, body.targetId,
      body.rating, body.title || '', body.content || '',
      body.photos, false,
    );
  }

  /** GET /social/reviews/:targetId — público (reseñas agregadas de un target). */
  @Get('reviews/:targetId')
  getReviews(
    @Param('targetId') targetId: string,
    @Query('targetType') targetType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getReviews(targetId, targetType, limit ? parseInt(limit) : 20);
  }

  /** GET /social/rating/:targetId — público. */
  @Get('rating/:targetId')
  getRating(@Param('targetId') targetId: string, @Query('targetType') targetType?: string) {
    return this.socialService.getRating(targetId, targetType || 'DELIVERY');
  }

  /** POST /social/reviews/:reviewId/vote — usuario autenticado. */
  @Post('reviews/:reviewId/vote')
  @UseGuards(JwtAuthGuard)
  voteReview(@Param('reviewId') reviewId: string, @Body() body: { helpful: boolean }) {
    return this.socialService.voteReview(reviewId, body.helpful);
  }

  // ── Referidos ───────────────────────────────────────────────────────
  /** POST /social/referrals — referidor = JWT. */
  @Post('referrals')
  @UseGuards(JwtAuthGuard)
  createReferral(@CurrentUser() user: any) {
    return this.socialService.createReferral(user.id);
  }

  /** POST /social/referrals/complete — evento de SISTEMA (tras primer viaje). */
  @Post('referrals/complete')
  @UseGuards(InternalServiceGuard)
  completeReferral(@Body() body: { referralCode: string; referredUserId: string }) {
    if (!body.referralCode || !body.referredUserId) {
      throw new BadRequestException('referralCode and referredUserId required');
    }
    return this.socialService.completeReferral(body.referralCode, body.referredUserId);
  }

  /** GET /social/referrals/stats — del propio usuario (JWT). */
  @Get('referrals/stats')
  @UseGuards(JwtAuthGuard)
  getReferralStats(@CurrentUser() user: any) {
    return this.socialService.getReferralStats(user.id);
  }

  // ── Gamificación ────────────────────────────────────────────────────
  /** GET /social/gamification/:userId — solo el propio usuario o admin. */
  @Get('gamification/:userId')
  @UseGuards(JwtAuthGuard)
  getGamificationStats(@Param('userId') userId: string, @CurrentUser() user: any) {
    this.assertSelfOrAdmin(user, userId);
    return this.socialService.getGamificationStats(userId);
  }

  /** POST /social/achievements/unlock — acción de SISTEMA. */
  @Post('achievements/unlock')
  @UseGuards(InternalServiceGuard)
  unlockAchievement(@Body() body: { userId: string; achievementId: string }) {
    if (!body.userId || !body.achievementId) {
      throw new BadRequestException('userId and achievementId required');
    }
    return this.socialService.unlockAchievement(body.userId, body.achievementId);
  }

  // ── Eventos ─────────────────────────────────────────────────────────
  /** GET /social/events — público (eventos activos). */
  @Get('events')
  getActiveEvents() {
    return this.socialService.getActiveEvents();
  }

  /** POST /social/events — crear evento con premios = admin. */
  @Post('events')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createEvent(
    @Body() body: {
      name: string; description: string; type: any;
      startDate: string; endDate: string; prize: string; rules: string;
    },
  ) {
    return this.socialService.createEvent(
      body.name, body.description, body.type,
      new Date(body.startDate), new Date(body.endDate),
      body.prize, body.rules,
    );
  }

  /** POST /social/events/:eventId/join — se une el propio usuario (JWT). */
  @Post('events/:eventId/join')
  @UseGuards(JwtAuthGuard)
  joinEvent(@Param('eventId') eventId: string, @CurrentUser() user: any) {
    return this.socialService.joinEvent(eventId, user.id);
  }

  // ── Puntos / recompensas ────────────────────────────────────────────
  /** GET /social/rewards/me — puntos del propio usuario (JWT). */
  @Get('rewards/me')
  @UseGuards(JwtAuthGuard)
  async getMyRewards(@CurrentUser() user: any) {
    return this.socialService.getRewards(user.id);
  }

  /** GET /social/rewards/:userId — solo el propio usuario o admin. */
  @Get('rewards/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserRewards(@Param('userId') userId: string, @CurrentUser() user: any) {
    this.assertSelfOrAdmin(user, userId);
    return this.socialService.getRewards(userId);
  }

  /** POST /social/rewards/award — otorgar puntos tras viaje = SISTEMA. */
  @Post('rewards/award')
  @UseGuards(InternalServiceGuard)
  async awardRidePoints(@Body() body: { userId: string; rideType: 'shared' | 'private' }) {
    if (!body.userId || !body.rideType) {
      throw new BadRequestException('userId and rideType required');
    }
    return this.socialService.awardRidePoints(body.userId, body.rideType);
  }
}
