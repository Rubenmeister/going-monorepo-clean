import { Controller, Post, Body, Get, Param, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateArticleUseCase,
  CreateArticleDto,
  GetArticleByIdUseCase,
  GetArticleBySlugUseCase,
  SearchArticlesUseCase,
  SearchArticleDto,
  PublishArticleUseCase,
} from '@going-monorepo-clean/domains-blog-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('articles')
@Controller('articles')
export class ArticleController {
  constructor(
    private readonly createArticleUseCase: CreateArticleUseCase,
    private readonly getArticleByIdUseCase: GetArticleByIdUseCase,
    private readonly getArticleBySlugUseCase: GetArticleBySlugUseCase,
    private readonly searchArticlesUseCase: SearchArticlesUseCase,
    private readonly publishArticleUseCase: PublishArticleUseCase,
  ) {}

  @Post()
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Crear un nuevo articulo' })
  @ApiBody({ type: CreateArticleDto })
  @ApiResponse({ status: 201, description: 'Articulo creado exitosamente' })
  async create(@Body() dto: CreateArticleDto) {
    return this.createArticleUseCase.execute(dto);
  }

  @Get('search')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Buscar articulos publicados' })
  @ApiResponse({ status: 200, description: 'Lista de articulos encontrados' })
  async search(@Query() filters: SearchArticleDto) {
    return this.searchArticlesUseCase.execute(filters);
  }

  @Get('slug/:slug')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Obtener un articulo por slug' })
  @ApiParam({ name: 'slug', description: 'Slug del articulo' })
  @ApiResponse({ status: 200, description: 'Articulo encontrado' })
  @ApiResponse({ status: 404, description: 'Articulo no encontrado' })
  async getBySlug(@Param('slug') slug: string) {
    const article = await this.getArticleBySlugUseCase.execute(slug);
    return article.toPrimitives();
  }

  @Get(':id')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Obtener un articulo por ID' })
  @ApiParam({ name: 'id', description: 'ID del articulo' })
  @ApiResponse({ status: 200, description: 'Articulo encontrado' })
  @ApiResponse({ status: 404, description: 'Articulo no encontrado' })
  async getById(@Param('id') id: UUID) {
    const article = await this.getArticleByIdUseCase.execute(id);
    return article.toPrimitives();
  }

  @Patch(':id/publish')
  @Roles('admin')
  @ApiOperation({ summary: 'Publicar un articulo' })
  @ApiParam({ name: 'id', description: 'ID del articulo a publicar' })
  @ApiResponse({ status: 200, description: 'Articulo publicado exitosamente' })
  @ApiResponse({ status: 404, description: 'Articulo no encontrado' })
  @ApiResponse({ status: 412, description: 'No se puede publicar el articulo en su estado actual' })
  async publish(@Param('id') id: UUID) {
    await this.publishArticleUseCase.execute(id);
    return { message: 'Article published successfully' };
  }
}
