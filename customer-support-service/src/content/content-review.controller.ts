import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { SocialService } from './social.service';
import { JwtAuthGuard, AdminGuard, CurrentUser } from '../infrastructure/auth/jwt.guard';

/**
 * ContentReviewController — panel de revisión editorial (SOLO ADMIN).
 *
 *  GET  /content-review/pending            — propuestas status='review'
 *  POST /content-review/:id/publish        — aprueba → status='published'
 *  POST /content-review/:id/reject         — descarta → status='rejected'
 *
 * NO se enruta por el gateway público (ese solo reenvía GET /content y /content/*).
 * El admin-dashboard lo consume vía su BFF same-origin (/api/content/*), que
 * reenvía el Bearer del admin. Guard: JWT válido + role 'admin'.
 */
@Controller('content-review')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ContentReviewController {
  constructor(
    private readonly content: ContentService,
    private readonly social: SocialService,
  ) {}

  @Get('pending')
  async pending(@Query('limit') limit?: string): Promise<{ items: any[] }> {
    const n = parseInt(limit ?? '50', 10);
    const items = await this.content.listReview(Number.isFinite(n) && n > 0 ? n : 50);
    return { items };
  }

  // ─── Redes sociales (propuestas de Sumak) ───────────────────────────
  @Get('social/pending')
  async socialPending(@Query('limit') limit?: string): Promise<{ items: any[] }> {
    const n = parseInt(limit ?? '50', 10);
    const items = await this.social.listReview(Number.isFinite(n) && n > 0 ? n : 50);
    return { items };
  }

  @Post('social/:id/approve')
  async socialApprove(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const item = await this.social.setStatus(id, 'approved', user?.email || user?.id, this.now());
    if (!item) throw new NotFoundException('Propuesta no encontrada o ya resuelta');
    return item;
  }

  @Post('social/:id/reject')
  async socialReject(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    const item = await this.social.setStatus(id, 'rejected', user?.email || user?.id, this.now());
    if (!item) throw new NotFoundException('Propuesta no encontrada o ya resuelta');
    return item;
  }

  @Post(':id/publish')
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    const item = await this.content.setStatus(id, 'published', user?.email || user?.id, this.now());
    if (!item) throw new NotFoundException('Propuesta no encontrada o ya resuelta');
    return item;
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() _body: unknown,
  ): Promise<any> {
    const item = await this.content.setStatus(id, 'rejected', user?.email || user?.id, this.now());
    if (!item) throw new NotFoundException('Propuesta no encontrada o ya resuelta');
    return item;
  }

  private now(): string {
    return new Date().toISOString();
  }
}
