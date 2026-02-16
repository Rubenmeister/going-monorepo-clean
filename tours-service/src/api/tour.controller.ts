import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateTourUseCase,
  CreateTourDto,
  GetTourByIdUseCase,
  SearchToursUseCase,
  SearchTourDto,
} from '@going-monorepo-clean/domains-tour-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('tours')
@Controller('tours')
export class TourController {
  constructor(
    private readonly createTourUseCase: CreateTourUseCase,
    private readonly getTourByIdUseCase: GetTourByIdUseCase,
    private readonly searchToursUseCase: SearchToursUseCase,
  ) {}

  @Post()
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Crear un nuevo tour' })
  @ApiBody({ type: CreateTourDto })
  @ApiResponse({ status: 201, description: 'Tour creado exitosamente' })
  async create(@Body() dto: CreateTourDto) {
    return this.createTourUseCase.execute(dto);
  }

  @Get('search')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Buscar tours publicados' })
  @ApiResponse({ status: 200, description: 'Lista de tours encontrados' })
  async search(@Query() filters: SearchTourDto) {
    return this.searchToursUseCase.execute(filters);
  }

  @Get(':id')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Obtener un tour por ID' })
  @ApiParam({ name: 'id', description: 'ID del tour' })
  @ApiResponse({ status: 200, description: 'Tour encontrado' })
  @ApiResponse({ status: 404, description: 'Tour no encontrado' })
  async getById(@Param('id') id: UUID) {
    const tour = await this.getTourByIdUseCase.execute(id);
    return tour.toPrimitives();
  }
}
