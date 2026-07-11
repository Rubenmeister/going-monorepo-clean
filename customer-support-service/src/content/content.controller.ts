import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';

/**
 * ContentController — sección de Comunicación de Going (PÚBLICO).
 *
 *  GET /content?channel=blog|revista|noticias&limit=20 — lista publicados
 *  GET /content/:id                                     — un item publicado
 *
 * Solo expone contenido con status='published'. Las propuestas en revisión
 * (status='review') NO se sirven por acá — eso es el panel de admin (aparte).
 */
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  async list(
    @Query('channel') channel?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: any[] }> {
    const n = parseInt(limit ?? '20', 10);
    const safe = Number.isFinite(n) && n > 0 ? n : 20;
    const ch = channel && ['blog', 'revista', 'noticias'].includes(channel) ? channel : undefined;
    const items = await this.content.listPublished(ch, safe);
    return { items };
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<any> {
    const item = await this.content.getById(id);
    if (!item) throw new NotFoundException('Contenido no encontrado');
    return item;
  }
}
