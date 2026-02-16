import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateExperienceDto,
  CreateExperienceUseCase,
  GetExperienceByIdUseCase,
  SearchExperiencesUseCase,
  SearchExperienceDto,
} from '@going-monorepo-clean/domains-experience-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('experiences')
@Controller('experiences')
export class ExperienceController {
  constructor(
    private readonly createExperienceUseCase: CreateExperienceUseCase,
    private readonly getByIdUseCase: GetExperienceByIdUseCase,
    private readonly searchUseCase: SearchExperiencesUseCase,
  ) {}

  @Post()
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Crear una nueva experiencia' })
  @ApiBody({ type: CreateExperienceDto })
  @ApiResponse({ status: 201, description: 'Experiencia creada exitosamente' })
  async createExperience(@Body() dto: CreateExperienceDto): Promise<any> {
    return this.createExperienceUseCase.execute(dto);
  }

  @Get('search')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Buscar experiencias publicadas' })
  @ApiResponse({ status: 200, description: 'Lista de experiencias encontradas' })
  async search(@Query() filters: SearchExperienceDto) {
    return this.searchUseCase.execute(filters);
  }

  @Get(':id')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Obtener una experiencia por ID' })
  @ApiParam({ name: 'id', description: 'ID de la experiencia' })
  @ApiResponse({ status: 200, description: 'Experiencia encontrada' })
  @ApiResponse({ status: 404, description: 'Experiencia no encontrada' })
  async getById(@Param('id') id: UUID) {
    const exp = await this.getByIdUseCase.execute(id);
    return exp.toPrimitives();
  }
}
